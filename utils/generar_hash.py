from passlib.hash import bcrypt

if __name__ == "__main__":
    password = input("Ingrese la contraseña a hashear: ")
    print("Hash bcrypt generado:\n")
    print(bcrypt.hash(password))

# Ejemplo de uso:
# $ python utils/generar_hash.py
# Ingrese la contraseña a hashear: mi_clave
# Hash bcrypt generado:
# $2b$12$...
