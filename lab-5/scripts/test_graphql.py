import requests
import time
import csv
from pathlib import Path

URL = "http://localhost:3000/graphql"  

QUERY = """
{
  users {
    id
    name
    email
  }
}
"""

def medir_graphql(n=30):
    resultados = []
    headers = {"Content-Type": "application/json"}

    for i in range(n):
        inicio = time.time()
        resposta = requests.post(URL, json={"query": QUERY}, headers=headers)
        fim = time.time()

        tempo_ms = (fim - inicio) * 1000
        tamanho = len(resposta.content)

        resultados.append(["GraphQL", tempo_ms, tamanho])
        print(f"[{i+1}] Tempo: {tempo_ms:.2f} ms | Tamanho: {tamanho} bytes")

    salvar_csv(resultados, "graphql")

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
    medir_graphql()
