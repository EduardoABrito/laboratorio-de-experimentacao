from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
import os
import html
from datetime import datetime

def calcular_tempo_analise(pr):
    created_at = datetime.fromisoformat(pr["createdAt"].replace("Z", "+00:00"))
    final_date_str = pr.get("mergedAt") or pr.get("closedAt")
    if final_date_str:
        final_date = datetime.fromisoformat(final_date_str.replace("Z", "+00:00"))
        return str(final_date - created_at)
    return "-"

def generate_pdf_table(valid_prs_list:list):
    try:
        nome_pdf = "relatorio-pullrequests"
        output_path = os.path.join("reports", f"{nome_pdf}.pdf")
        doc = SimpleDocTemplate(output_path, pagesize=A4)
        elements = []

        styles = getSampleStyleSheet()
        title = Paragraph("Relatório de Pull Requests Válidos", styles['Title'])
        subtitle = Paragraph("Métricas extraídas de PRs com review após 1 hora", styles['Heading2'])

        data = [
            [
                "Repositório", "Título PR", "Arquivos", "+Linhas", "-Linhas",
                "Tempo de análise", "Descrição (#chars)", "Participantes", "Comentários"
            ]
        ]
        title_style = ParagraphStyle(name="TitleCell", fontSize=8, leading=10)

        for repo_data in valid_prs_list:
            repo_name = repo_data["repository"]
            for pr in repo_data["valid_prs"]:
                pr_title = Paragraph(html.escape(pr["title"]), title_style)
                data.append([
                    repo_name,
                    pr_title,  
                    pr["changedFiles"],
                    pr["additions"],
                    pr["deletions"],
                    calcular_tempo_analise(pr),
                    len(pr["body"]) if pr["body"] else 0,
                    pr["participants"]["totalCount"],
                    pr["comments"]["totalCount"]
                ])

        table = Table(data, repeatRows=1, colWidths=[100, 140, 40, 40, 40, 80, 60, 50, 50])
        table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.lightgrey),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.black),
            ("ALIGN", (0, 0), (-1, -1), "CENTER"),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 8),
            ("BOTTOMPADDING", (0, 0), (-1, 0), 10),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
        ]))

        elements.extend([title, subtitle, table])
        doc.build(elements)

        print(f"✅ PDF '{nome_pdf}.pdf' criado com sucesso")
    except Exception as e:
        print(f"❌ Erro ao gerar PDF: {e}")
