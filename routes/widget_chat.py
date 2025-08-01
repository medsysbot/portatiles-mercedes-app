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

VOICE_TTS = "alloy"
TTS_LANGUAGE = "es"
GENERAL_LIMIT_DAYS = 7

CHATGPT_LINK = "https://chat.openai.com/"
DISCLAIMER = "Este asistente no es ChatGPT oficial; es solo una integración a APIs públicas de OpenAI."

client = OpenAI(api_key=OPENAI_API_KEY)
router = APIRouter()

DATOS_CONTACTO = (
    "Nuestros datos oficiales están en el pie de página:\n"
    "Teléfono/WhatsApp: +54 9 2657 627996\n"
    "Email: info@portatilesmercedes.com.ar\n"
    "No existe página de contacto específica."
)
DATOS_REGISTRO = (
    "Para registrarte en Portátiles Mercedes:\n"
    "1. Ve a la página de Login.\n"
    "2. Haz clic en 'Registrar'.\n"
    "3. Completa tus datos y confirma tu contraseña.\n"
    "4. Recibirás un correo para activar tu cuenta."
)
DATOS_RECUPERAR = (
    "Para recuperar tu contraseña:\n"
    "1. Ingresa en la página de Login.\n"
    "2. Haz clic en 'Recuperar Contraseña'.\n"
    "3. Ingresa el correo registrado y sigue las instrucciones que te llegarán al email."
)

KEYWORDS_SITIO = [
    "portátiles mercedes", "baño químico", "baños químicos", "baño portátil", "baños portátiles",
    "alquiler de baños", "alquiler baño", "alquilar baño", "alquilar un baño", "servicios de baños",
    "funcionamiento de baños", "cómo funciona un baño", "historia de los baños", "mantener baño químico",
    "limpieza de baño químico", "uso del baño químico", "sanitario químico", "información de baños químicos"
]

def is_general_interest(question: str) -> bool:
    pregunta = question.lower()
    for palabra in KEYWORDS_SITIO:
        if palabra in pregunta:
            return False  # Si es del sitio, NUNCA se considera general
    palabras_clave = [
        "fútbol", "clima", "deporte", "temperatura", "quién ganó", "dólar",
        "noticias", "presidente", "música", "película", "cine", "videojuego",
        "juego", "concierto", "cocina", "receta", "chiste", "cumpleaños", "cumple",
        "amor", "pareja", "amigos", "amistad", "animal", "perro", "gato",
        "cualquier cosa", "tema general", "cosas generales"
    ]
    return any(palabra in pregunta for palabra in palabras_clave)

def is_portatiles_query(question: str) -> bool:
    pregunta = question.lower()
    for palabra in KEYWORDS_SITIO:
        if palabra in pregunta:
            return True
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
    return any(palabra in pregunta for palabra in temas_sitio)

def match_contacto(question: str) -> bool:
    q = question.lower()
    return any(p in q for p in [
        "contacto", "teléfono", "whatsapp", "whatsap", "whats app", "correo", "mail", "email", "e-mail", "mail de contacto", "cómo contact", "como contact"
    ])

def match_registro(question: str) -> bool:
    q = question.lower()
    return any(p in q for p in [
        "registrar", "registro", "crear cuenta", "cómo me registro", "como me registro", "cómo crear usuario", "alta de usuario", "hacer una cuenta"
    ])

def match_recuperar(question: str) -> bool:
    q = question.lower()
    return any(p in q for p in [
        "recuperar contraseña", "olvidé mi contraseña", "olvide mi contraseña", "olvidé el password", "olvidé la clave", "resetear contraseña", "restablecer contraseña"
    ])

def set_general_cookie(response: Response):
    expire = int(time.time()) + GENERAL_LIMIT_DAYS * 24 * 3600
    response.set_cookie(
        key="robot_widget_general",
        value=str(expire),
        max_age=GENERAL_LIMIT_DAYS * 24 * 3600,
        httponly=True,
        samesite="Lax"
    )

def is_general_cookie_valid(request: Request):
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
    prompt = ""
    # Procesar entrada (audio o texto)
    if audio is not None:
        with NamedTemporaryFile(delete=False, suffix=".mp3") as temp_audio:
            temp_audio.write(await audio.read())
            temp_audio.flush()
            audio_path = temp_audio.name
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

    already_general = is_general_cookie_valid(request)
    respuesta_texto = ""
    custom_reply = False

    # 1. RESPUESTAS EXACTAS (contacto, registro, recuperar)
    if match_contacto(prompt):
        respuesta_texto = DATOS_CONTACTO
        custom_reply = True
    elif match_registro(prompt):
        respuesta_texto = DATOS_REGISTRO
        custom_reply = True
    elif match_recuperar(prompt):
        respuesta_texto = DATOS_RECUPERAR
        custom_reply = True

    # 2. CONSULTAS DEL SITIO (baños, alquiler, funcionamiento, historia, mantenimiento, etc)
    elif is_portatiles_query(prompt):
        system_prompt = (
            "Eres el asistente oficial de Portátiles Mercedes. "
            "Responde únicamente sobre el funcionamiento, procesos, historia, uso, mantenimiento y secciones del sitio Portátiles Mercedes y baños químicos. "
            "No respondas preguntas de cultura general, deportes, clima, chistes ni temas personales. "
            "Sé técnico, concreto y breve. No inventes información. "
            "Si no sabes la respuesta, indica que consulte a administración."
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
        custom_reply = False

    # 3. PREGUNTAS GENERALES (solo 1 por semana, NUNCA bloquea nada del sitio)
    elif is_general_interest(prompt):
        if already_general:
            respuesta_texto = (
                "Solo respondo una pregunta general por semana y usuario. El resto del tiempo, solo puedo ayudarte con temas de Portátiles Mercedes.\n\n"
                "Este asistente es una API que utiliza ChatGPT de OpenAI para responder dudas específicas de este sitio. "
                "Si te interesa seguir conversando sobre temas generales, podés usar el ChatGPT oficial: https://chat.openai.com/"
            )
            custom_reply = True
        else:
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
                "\n\nRecuerda: solo puedes hacer una consulta general por semana. "
                "Si querés seguir investigando otros temas generales, podés usar el ChatGPT oficial: https://chat.openai.com/"
            )
            custom_reply = True
            set_general_cookie(response)

    # 4. Sin categoría clara (fallback)
    else:
        respuesta_texto = (
            "Hola, soy el asistente de Portátiles Mercedes. "
            "Podés consultarme sobre login, registro, pagos, funcionamiento, mantenimiento, historia, alquiler y uso de baños químicos y portátiles. "
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
    audio_path = f"/tmp/{audio_filename}" if not audio_filename.startswith("/tmp") else audio_filename
    if not os.path.exists(audio_path):
        return JSONResponse({"error": "Archivo no encontrado"}, status_code=404)
    return FileResponse(audio_path, media_type="audio/mpeg", filename="respuesta.mp3")
