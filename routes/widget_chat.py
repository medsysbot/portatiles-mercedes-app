import os
import time
from fastapi import APIRouter, File, UploadFile, Form, Request, Response
from fastapi.responses import JSONResponse, FileResponse
from openai import OpenAI
from tempfile import NamedTemporaryFile
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
if not OPENAI_API_KEY:
    raise RuntimeError("Falta la variable OPENAI_API_KEY en el .env")

# Configuración general
VOICE_TTS = "alloy"        # Voz masculina de OpenAI TTS
TTS_LANGUAGE = "es"        # Español
GENERAL_LIMIT_DAYS = 7     # Días de bloqueo para preguntas generales
MAX_AUDIO_MB = 2           # Máx. 2 MB por audio
MAX_AUDIO_SECONDS = 35     # Máx. 35 seg por audio (control simple, no estricto)

CHATGPT_LINK = "https://chat.openai.com/"
DISCLAIMER = "Este asistente no es ChatGPT oficial; es solo una integración a APIs públicas de OpenAI."

# Inicializar cliente OpenAI
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
    """Detecta si la pregunta es del sitio (login, registro, secciones, etc)"""
    temas_sitio = [
        "login", "registrar", "registro", "inicio de sesión", "olvidé mi contraseña",
        "cambiar contraseña", "formulario", "sección", "dónde encuentro", "cómo hago",
        "alquiler", "ventas", "pagar", "cliente", "panel", "comprobante", "contacto",
        "empleado", "administrador", "portal", "navegar", "funciona", "problema acceso"
    ]
    pregunta = question.lower()
    for palabra in temas_sitio:
        if palabra in pregunta:
            return True
    return False

def get_cookie_key(request: Request):
    """Genera un identificador de usuario por cookie"""
    return request.cookies.get("robot_widget_id")

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
    Endpoint principal del widget.
    - text: texto de la pregunta (opcional si viene audio)
    - audio: archivo de audio (opcional si viene texto)
    - want_audio: bool, si la respuesta se debe devolver también en audio
    """
    prompt = ""
    # 1. Procesar entrada (audio o texto)
    if audio is not None:
        # Guardar audio temporalmente
        with NamedTemporaryFile(delete=False, suffix=".mp3") as temp_audio:
            temp_audio.write(await audio.read())
            temp_audio.flush()
            audio_path = temp_audio.name
        # Usar Whisper (OpenAI) para transcribir
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

    # 2. Lógica de control
    already_general = is_general_cookie_valid(request)
    respuesta_texto = ""
    custom_reply = False

    # -- a. Pregunta sobre Portátiles Mercedes (ayuda real)
    if is_portatiles_query(prompt):
        system_prompt = (
            "Eres el asistente oficial de Portátiles Mercedes. "
            "Responde de forma clara y profesional a consultas sobre cómo usar el sitio, hacer login, registrarse, encontrar secciones, pagar, subir comprobantes, y ayuda relacionada con la plataforma. "
            "Si la pregunta es ambigua o múltiple, pedí amablemente que la unifique en una sola consulta. "
            "Si ya contestaste la pregunta anterior y vuelve sobre el mismo tema, preguntá si tiene alguna duda extra. "
            "Nunca respondas a temas fuera de Portátiles Mercedes, salvo para saludar o despedirte."
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
    # -- b. Pregunta de interés general (fútbol, clima, etc)
    elif is_general_interest(prompt):
        if already_general:
            respuesta_texto = (
                "En este momento estoy en horario de trabajo y no puedo conversar sobre temas generales. "
                f"Si querés seguir conversando sobre otros temas, podés usar ChatGPT aquí: {CHATGPT_LINK}"
            )
            custom_reply = True
        else:
            respuesta_texto = (
                "Esta es tu consulta general de la semana. "
                "Mi función principal es ayudarte con Portátiles Mercedes. "
                "Pero aquí va mi respuesta:\n\n"
            )
            system_prompt = (
                "Responde en un solo párrafo breve y claro, en lenguaje neutral y profesional."
                "No repitas la pregunta. No agregues detalles personales."
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
            custom_reply = True
            set_general_cookie(response)
    # -- c. Otras preguntas o sin tema claro
    else:
        respuesta_texto = (
            "Hola, soy el asistente de Portátiles Mercedes. "
            "Podés consultarme sobre login, registro, pagos, y uso del sistema. "
            "Para temas generales respondé una sola vez por semana. "
            f"{DISCLAIMER}"
        )
        custom_reply = True

    # 3. Si la respuesta debe ir en audio (TTS OpenAI)
    respuesta_audio_url = None
    if want_audio:
        tts_response = client.audio.speech.create(
            model="tts-1",
            voice=VOICE_TTS,
            input=respuesta_texto,
            response_format="mp3",
            speed=1.0
        )
        # Guardar el audio temporalmente y devolver como archivo
        temp_audio_out = NamedTemporaryFile(delete=False, suffix=".mp3")
        temp_audio_out.write(tts_response.content)
        temp_audio_out.flush()
        temp_audio_out.close()
        respuesta_audio_url = f"/api/widget_chat/audio/{os.path.basename(temp_audio_out.name)}"

    # 4. Devolver respuesta
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
