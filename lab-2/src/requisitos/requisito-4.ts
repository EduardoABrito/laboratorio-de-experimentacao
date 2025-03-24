import { CalculoMaximas } from '../service/calculoMaxMetrica.service';
import { RepositoryEntity } from '../entities/repository.entity';
import { createChart } from '../utils/create-chart.util';
import { createCsv } from '../utils/create-csv.util';
import { Requisito4ResponseDto } from './dto/requisitos-response.dto';
import { requisito4Mapper } from './mapper/requisitos.mapper';
import { responseMaxDTO } from 'src/service/dto/responseMax.dto';

export class Requisito4 {
  constructor(repositories: RepositoryEntity[]) {
    this.repositories = repositories;
  }

  private readonly question = `RQ 04. Qual a relação entre o tamanho dos repositórios e as suas características de qualidade?`;
  private results: Requisito4ResponseDto[] | null = null;
  private repositories: RepositoryEntity[];

  private calculateQualityScore(repository: RepositoryEntity, maximos : responseMaxDTO): number {
        const { metricsCk } = repository;
        const { cbo, dit, lcom, loc} = metricsCk;
        
        if(loc == 0 || loc == null) return 0

        const W_cbo = 0.2;
        const W_dit = 0.2;
        const W_lcom = 0.2;
    
        const normalizedCbo = cbo !== null ? cbo / maximos.maxCbo : 0;
        const normalizedDit = dit !== null ? dit / maximos.maxDit : 0;
        const normalizedLcom = lcom !== null ? 1 - lcom / maximos.maxLcom : 1;
    
        return (
          W_cbo * normalizedCbo +
          W_dit * normalizedDit +
          W_lcom * normalizedLcom
        );
      }

  async execute(): Promise<Requisito4ResponseDto[]> {
    const maximos =  CalculoMaximas.calcular(this.repositories)
    const result = this.repositories.map((repo) => {
      const mapped = requisito4Mapper(repo);
      mapped.compositeScore = this.calculateQualityScore(repo, maximos);
      return mapped;
    });

    this.results = result;

    await this.saveCsv();
    await this.saveChart();

    return this.results;
  }

  async saveCsv(): Promise<void> {
    if (!this.verifyResults()) {
      return;
    }

    createCsv(this.results, './resultados/csv/requisito-4.csv');
  }

  async saveChart() {
    if (!this.verifyResults()) {
      return;
    }

    const config = {
      type: 'scatter',
      data: {
        datasets: [
          {
            label: 'Loc vs Qualidade',
            data: this.results
            .filter(r => r.loc != null && r.compositeScore != null) // Filtra dados inválidos
            .map(r => ({
              x: r.loc,
              y: r.compositeScore,
            })),
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            display: true,
            position: 'top',
          },
        },
        scales: {
          x: {
            title: {
              display: true,
              text: 'Repositórios',
            },
          },
          y: {
            title: {
              display: true,
              text: 'Pontuação de Atividade',
            },
            beginAtZero: true,
          },
        },
      },
    };

    await createChart(
      config,
      `requisito-4-tamanho-vs-qualidade-${this.results.length}`,
    );
  }

  verifyResults(): boolean {
    if (this.results) return true;

    console.log('==============================================');
    console.log(this.question);
    console.log(
      `Ainda não foi possível obter os resultados, execute o método execute() antes de chamar este método.`,
    );
    console.log('==============================================');

    return false;
  }

  toStringResult(): void {
    if (!this.verifyResults()) {
      return;
    }

    console.log('==============================================');
    console.log(this.question);
    console.log(
      `Pontuação média de qualidade: ${
        this.results.reduce((acc, curr) => acc + curr.compositeScore, 0) / this.results.length
      }`,
    );
    console.log('==============================================');
  }
}
