import os
import time
from fastapi import APIRouter, File, UploadFile, Form, Request, Response, HTTPException
from fastapi.responses import JSONResponse, FileResponse
from openai import OpenAI
from tempfile import NamedTemporaryFile
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
if not OPENAI_API_KEY:
    raise RuntimeError("Falta la variable OPENAI_API_KEY en el .env")

VOICE_TTS = "alloy"        # Voz masculina de OpenAI TTS
TTS_LANGUAGE = "es"        # Español
GENERAL_LIMIT_DAYS = 7     # Días de bloqueo para preguntas generales
MAX_AUDIO_MB = 2           # Máx. 2 MB por audio
MAX_AUDIO_SECONDS = 35     # Máx. 35 seg por audio (control simple, no estricto)

CHATGPT_LINK = "https://chat.openai.com/"
DISCLAIMER = "Este asistente no es ChatGPT oficial; es solo una integración a APIs públicas de OpenAI."

client = OpenAI(api_key=OPENAI_API_KEY)
router = APIRouter()

def is_general_interest(question: str) -> bool:
    """Detecta si la pregunta es de interés general (NO del sistema)"""
    palabras_clave = [
        "fútbol", "clima", "deporte", "temperatura", "quién ganó", "dólar",
        "noticias", "presidente", "música", "película", "cine", "videojuego",
        "juego", "concierto", "cocina", "receta", "chiste", "cumpleaños", "cumple",
        "amor", "pareja", "amigos", "amistad", "animal", "perro", "gato",
        "cualquier cosa", "tema general", "cosas generales"
    ]
    pregunta = question.lower()
    for palabra in palabras_clave:
        if palabra in pregunta:
            return True
    return False

def is_portatiles_query(question: str) -> bool:
    """Detecta si la pregunta es del sitio (funcionalidad o procesos internos)"""
    temas_sitio = [
        "login", "registrar", "registro", "inicio de sesión", "olvidé mi contraseña",
        "cambiar contraseña", "formulario", "sección", "dónde encuentro", "cómo hago",
        "alquiler", "alquilar", "alquilar baño", "alquiler de baño", "alquiler baño", 
        "baño químico", "baño portátil", "baños químicos", "baños portátiles",
        "reservar baño", "servicio de baño", "servicio de baños", "servicios", 
        "pagar", "pago", "cliente", "clientes", "panel", "comprobante", "contacto",
        "empleado", "administrador", "portal", "navegar", "funciona", "problema acceso",
        "contratar baño", "contratar servicio", "necesito baño", "quiero baño"
    ]
    pregunta = question.lower()
    for palabra in temas_sitio:
        if palabra in pregunta:
            return True
    return False

def set_general_cookie(response: Response):
    """Setea cookie que bloquea preguntas generales por 7 días"""
    expire = int(time.time()) + GENERAL_LIMIT_DAYS * 24 * 3600
    response.set_cookie(
        key="robot_widget_general",
        value=str(expire),
        max_age=GENERAL_LIMIT_DAYS * 24 * 3600,
        httponly=True,
        samesite="Lax"
    )

def is_general_cookie_valid(request: Request):
    """Verifica si la cookie de control de generalidad sigue vigente"""
    valor = request.cookies.get("robot_widget_general")
    if not valor:
        return False
    try:
        return int(valor) > int(time.time())
    except Exception:
        return False

@router.post("/api/widget_chat")
async def widget_chat(
    request: Request,
    response: Response,
    text: str = Form(None),
    audio: UploadFile = File(None),
    want_audio: bool = Form(False)
):
    """
    Endpoint principal del widget de IA de Portátiles Mercedes.
    Responde sobre el sitio siempre. Solo 1 pregunta general por usuario por semana.
    """
    prompt = ""
    # Procesar entrada (audio o texto)
    if audio is not None:
        # Guardar audio temporalmente
        with NamedTemporaryFile(delete=False, suffix=".mp3") as temp_audio:
            temp_audio.write(await audio.read())
            temp_audio.flush()
            audio_path = temp_audio.name
        # Usar Whisper para transcribir
        with open(audio_path, "rb") as f:
            transcript = client.audio.transcriptions.create(
                model="whisper-1",
                file=f,
                response_format="text",
                language="es"
            )
        prompt = transcript.strip()
        os.remove(audio_path)
    elif text:
        prompt = text.strip()
    else:
        return JSONResponse({"error": "No se envió texto ni audio"}, status_code=400)

    if not prompt:
        return JSONResponse({"error": "No se detectó pregunta"}, status_code=400)

    # --- Lógica de control de temas ---
    already_general = is_general_cookie_valid(request)
    respuesta_texto = ""
    custom_reply = False

    # 1. Pregunta sobre Portátiles Mercedes (siempre responde)
 if is_portatiles_query(prompt):
     system_prompt = (
        "Eres el asistente oficial de Portátiles Mercedes. "
        "Responde únicamente sobre el funcionamiento, consultas técnicas, secciones y procesos del sitio Portátiles Mercedes. "
        "Si te preguntan por datos de contacto, teléfono, WhatsApp o correo, responde exactamente: "
        "'Nuestros datos oficiales están en el pie de página: Teléfono/WhatsApp +54 9 2657 627996, Email info@portatilesmercedes.com.ar. No existe página de contacto específica.' "
        "No inventes páginas de contacto. "
        "No respondas consultas de temas generales, cultura, deporte, política, clima, chistes ni temas personales. "
        "Si te preguntan algo fuera de Portátiles Mercedes, responde amablemente que solo puedes ayudar con temas del sitio. "
        "Evita cualquier tipo de creatividad, opiniones personales, ejemplos inventados o historias ficticias. "
        "Responde de forma breve, técnica, concreta y sin rodeos. "
        "No inventes información. Si no sabes la respuesta o no está en la documentación de Portátiles Mercedes, responde: "
        "No tengo esa información. Por favor, consulte directamente con el equipo de soporte de Portátiles Mercedes."
        "Nunca respondas a temas fuera de Portátiles Mercedes, salvo para saludar o despedirte."
        "No completes, no infieras, no improvises información que no esté documentada oficialmente. "
        "Nunca asumas datos, precios, horarios o pasos que no estén explícitos en la información oficial del sitio."
    )
    chat_response = client.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": prompt}
        ],
        max_tokens=350,
        temperature=0.35
    )
    respuesta_texto = chat_response.choices[0].message.content.strip()
    # 2. Pregunta general (solo 1 por semana)
    elif is_general_interest(prompt):
        if already_general:
            # Ya preguntó: no responde, solo invita a ChatGPT
            respuesta_texto = (
                "En este momento solo puedo ayudarte con temas de Portátiles Mercedes.\n\n"
                "Si te interesa seguir conversando sobre temas generales, podés usar el ChatGPT oficial: https://chat.openai.com/"
            )
            custom_reply = True
        else:
            # Primera vez: hace la excepción y contesta
            respuesta_texto = (
                "En este momento estoy en horario laboral y normalmente solo respondo temas de Portátiles Mercedes, "
                "pero voy a hacer una excepción y responder tu consulta:\n\n"
            )
            system_prompt = (
                "Responde solo a esta consulta puntual en un solo párrafo breve y claro, sin repetir la pregunta. "
                "No incluyas datos personales ni historias. No des consejos. No agregues información adicional."
            )
            chat_response = client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=250,
                temperature=0.35
            )
            respuesta_texto += chat_response.choices[0].message.content.strip()
            respuesta_texto += (
                "\n\nSi querés seguir investigando otros temas generales, podés usar el ChatGPT oficial: https://chat.openai.com/"
            )
            custom_reply = True
            set_general_cookie(response)
    # 3. Sin categoría clara (descriptive fallback)
    else:
        respuesta_texto = (
            "Hola, soy el asistente de Portátiles Mercedes. "
            "Podés consultarme sobre login, registro, pagos, y uso del sistema. "
            "Para temas generales respondo solo una consulta por semana por usuario. "
            f"{DISCLAIMER}"
        )
        custom_reply = True

    # Respuesta en audio (si se requiere)
    respuesta_audio_url = None
    if want_audio:
        tts_response = client.audio.speech.create(
            model="tts-1",
            voice=VOICE_TTS,
            input=respuesta_texto,
            response_format="mp3",
            speed=1.0
        )
        temp_audio_out = NamedTemporaryFile(delete=False, suffix=".mp3")
        temp_audio_out.write(tts_response.content)
        temp_audio_out.flush()
        temp_audio_out.close()
        respuesta_audio_url = f"/api/widget_chat/audio/{os.path.basename(temp_audio_out.name)}"

    result = {
        "ok": True,
        "respuesta_texto": respuesta_texto,
        "respuesta_audio_url": respuesta_audio_url,
        "custom_reply": custom_reply,
        "disclaimer": DISCLAIMER if custom_reply else ""
    }
    return JSONResponse(result)

@router.get("/api/widget_chat/audio/{audio_filename}")
async def get_widget_audio(audio_filename: str):
    """Devuelve el archivo de audio generado (TTS)"""
    audio_path = f"/tmp/{audio_filename}" if not audio_filename.startswith("/tmp") else audio_filename
    if not os.path.exists(audio_path):
        return JSONResponse({"error": "Archivo no encontrado"}, status_code=404)
    return FileResponse(audio_path, media_type="audio/mpeg", filename="respuesta.mp3")
