from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet
import os

def generate_pdf_table(repos):
    try:
        nome_pdf = "lista-repositorios"
        output_path = os.path.join("reports", f"{nome_pdf}.pdf")

        doc = SimpleDocTemplate(output_path, pagesize=A4)
        elements = []

        styles = getSampleStyleSheet()
        title = Paragraph("Lista de Repositórios Populares", styles['Title'])
        subtitle = Paragraph("Nome e dono dos repositórios", styles['Heading2'])

        data = [["Nome do Repositório", "Dono"]]
        for repo in repos:
            name = repo["node"]["name"]
            owner = repo["node"]["owner"]["login"]
            data.append([name, owner])

        table = Table(data, colWidths=[250, 250])
        table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.lightgrey),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.black),
            ("ALIGN", (0, 0), (-1, -1), "CENTER"),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("BOTTOMPADDING", (0, 0), (-1, 0), 12),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
        ]))

        elements.extend([title, subtitle, table])
        doc.build(elements)

        print(f"✅ PDF '{nome_pdf}.pdf' criado com sucesso")
    except Exception as e:
        print(f"❌ Erro ao gerar PDF: {e}")
