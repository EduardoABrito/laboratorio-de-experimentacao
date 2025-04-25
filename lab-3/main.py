from src.extraction import collect_valid_prs_from_repositories
from src.visualization import generate_pdf_table
from src.analise_prs import extract_data_from_pdf

if __name__ == "__main__":
    repos = collect_valid_prs_from_repositories()
    generate_pdf_table(repos)
    extract_data_from_pdf()
    
