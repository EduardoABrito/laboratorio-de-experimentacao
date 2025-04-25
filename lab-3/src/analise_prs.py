import os
import re
import pandas as pd
import fitz  # PyMuPDF
import seaborn as sns
import matplotlib.pyplot as plt
from scipy.stats import spearmanr
from matplotlib.backends.backend_pdf import PdfPages


def extract_data_from_pdf():
    pdf_path = 'reports/relatorio-pullrequests.pdf'
    doc = fitz.open(pdf_path)
    text = "".join(page.get_text() for page in doc)

    pattern = re.compile(
        r"(?P<repo>[^\n]+?)\s+(?P<title>.+?)\s+(?P<files>\d+)\s+(?P<add>\d+)\s+(?P<del>\d+)\s+(?P<duration>[\d\s\w:,]+)\s+(?P<desc_len>\d+)\s+(?P<participants>\d+)\s+(?P<comments>\d+)"
    )

    matches = pattern.findall(text)

    df = pd.DataFrame(matches, columns=[
        "repo", "title", "files", "add", "del", "duration", "desc_len", "participants", "comments"
    ])
    df[["files", "add", "del", "desc_len", "participants", "comments"]] = df[[
        "files", "add", "del", "desc_len", "participants", "comments"
    ]].astype(int)

    def duration_to_hours(duration_str):
        days = re.search(r"(\d+)\s*days?", duration_str)
        time = re.search(r"(\d{1,2}):(\d{2}):(\d{2})", duration_str)
        seconds = 0
        if days: seconds += int(days.group(1)) * 86400
        if time:
            h, m, s = map(int, time.groups())
            seconds += h * 3600 + m * 60 + s
        return seconds / 3600

    df["analysis_hours"] = df["duration"].apply(duration_to_hours)

    correlacoes = [
        ("files", "comments", "Arquivos", "Feedback (Comentários)"),
        ("add", "comments", "Linhas Adicionadas", "Feedback (Comentários)"),
        ("del", "comments", "Linhas Removidas", "Feedback (Comentários)"),
        ("analysis_hours", "comments", "Tempo de Análise (h)", "Feedback (Comentários)"),
        ("desc_len", "comments", "Tamanho da Descrição", "Feedback (Comentários)"),
        ("participants", "comments", "Participantes", "Feedback (Comentários)"),
        ("files", "participants", "Arquivos", "Número de Revisões"),
        ("add", "participants", "Linhas Adicionadas", "Número de Revisões"),
        ("del", "participants", "Linhas Removidas", "Número de Revisões"),
        ("analysis_hours", "participants", "Tempo de Análise (h)", "Número de Revisões"),
        ("desc_len", "participants", "Tamanho da Descrição", "Número de Revisões"),
        ("comments", "participants", "Comentários", "Número de Revisões"),
    ]

    output_pdf_path = 'reports/plots/all_correlations.pdf'
    os.makedirs('reports/plots', exist_ok=True)

    with PdfPages(output_pdf_path) as pdf_pages:
        for x, y, label_x, label_y in correlacoes:
            spearman_report(df, x, y, label_x, label_y)
            plot_spearman_scatter(df, x, y, label_x, label_y, pdf_pages)

    print(f"✅ Todos os gráficos foram salvos em '{output_pdf_path}'!")

def spearman_report(df, x, y, label_x, label_y):
    df_valid = df[[x, y]].dropna()
    coef, p = spearmanr(df_valid[x], df_valid[y])
    print(f"📌 Correlação entre {label_x} e {label_y}:\n  ρ = {coef:.3f}, p = {p:.5f}\n")
    return coef, p

def plot_spearman_scatter(df, x, y, label_x, label_y, pdf_pages):
    df_valid = df[[x, y]].dropna()
    coef, p = spearmanr(df_valid[x], df_valid[y])

    plt.figure(figsize=(8, 6))
    sns.scatterplot(data=df_valid, x=x, y=y, alpha=0.6)
    sns.regplot(x=x, y=y, data=df_valid, scatter=False, color="red", label=f"ρ = {coef:.2f}")
    plt.title(f"{label_x} vs {label_y}")
    plt.xlabel(label_x)
    plt.ylabel(label_y)
    plt.legend()
    plt.tight_layout()

    pdf_pages.savefig()
    plt.close()
