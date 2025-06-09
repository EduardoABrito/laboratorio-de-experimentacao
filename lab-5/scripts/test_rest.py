import requests
import time
import csv
from pathlib import Path

URL = "http://localhost:3000/api/users"

def medir_rest(n=30):
    resultados = []
    for i in range(n):
        inicio = time.time()
        resposta = requests.get(URL)
        fim = time.time()

        tempo_ms = (fim - inicio) * 1000
        tamanho = len(resposta.content)

        resultados.append(["REST", tempo_ms, tamanho])

        print(f"[{i+1}] Tempo: {tempo_ms:.2f} ms | Tamanho: {tamanho} bytes")

    salvar_csv(resultados, "rest")

def salvar_csv(dados, tipo):
    Path("data").mkdir(exist_ok=True)
    caminho = Path("data/resultados.csv")
    cabecalho = ["tipo", "tempo_ms", "tamanho_bytes"]

    if not caminho.exists():
        with open(caminho, "w", newline="") as f:
            writer = csv.writer(f)
            writer.writerow(cabecalho)
            writer.writerows(dados)
    else:
        with open(caminho, "a", newline="") as f:
            writer = csv.writer(f)
            writer.writerows(dados)

if __name__ == "__main__":
    medir_rest()
