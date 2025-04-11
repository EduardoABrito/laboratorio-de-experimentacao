from src.extraction import collect_valid_prs_from_repositories
from src.visualization import generate_pdf_table

if __name__ == "__main__":
    repos = collect_valid_prs_from_repositories()
    generate_pdf_table(repos)
