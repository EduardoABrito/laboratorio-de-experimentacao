import { RepositoryEntity } from '../entities/repository.entity';
import { createChart } from '../utils/create-chart.util';
import { createCsv } from '../utils/create-csv.util';
import { Requisito2ResponseDto } from './dto/requisitos-response.dto';
import { requisito2Mapper } from './mapper/requisitos.mapper';
import { calculateAgeYears } from '../utils/calculate_age_years.util'
import { CalculoMaximas } from '../service/calculoMaxMetrica.service';
import { responseMaxDTO } from 'src/service/dto/responseMax.dto';

export class Requisito2 {
  private readonly question = `RQ 02. Qual a relação entre a maturidade dos repositórios e as suas características de qualidade?`;
  private results: Requisito2ResponseDto[] | null = null;
  private repositories: RepositoryEntity[];
  private oldRepository: number
  constructor(repositories: RepositoryEntity[]) {
    this.repositories = repositories;
  }

  private calculateMaturityScore(repository: RepositoryEntity, maximos : responseMaxDTO): number {
    const { metricsCk } = repository;
    const { cbo, dit, lcom } = metricsCk;

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

  async execute(): Promise<Requisito2ResponseDto[]> {
    const maximos =  CalculoMaximas.calcular(this.repositories)
    const result = this.repositories.map((repo) => {
      const mapped = requisito2Mapper(repo);
      mapped.compositeScore = this.calculateMaturityScore(repo, maximos); 
      return mapped;
    });

    this.results = result;

    await this.saveCsv();
    return this.results;
  }
  

  async saveCsv(): Promise<void> {
    if (!this.verifyResults()) {
      return;
    }
    createCsv(this.results, './resultados/csv/requisito-2.csv');
  }

  async saveChart(): Promise<void> {
    if (!this.verifyResults()) {
      return;
    }


    

    const config = {
      type: 'scatter',
      data: {
        datasets: [
          {
            label: 'Maturidade vs. Qualidade',
            data: this.results
                        .filter(r => r.createdAt != null && r.compositeScore != null) // Filtra dados inválidos
                        .map(r => ({
                          x: calculateAgeYears(r.createdAt),
                          y: r.compositeScore,
                        })),
            backgroundColor: 'green',
          },
        ],
      },
      options: {
        title: {
          display: true,
          text: this.question,
        },
        scales: {
          x: {
            title: {
              display: true,
              text: 'Maturidade (anos)',
            },
          },
          y: {
            title: {
              display: true,
              text: 'Pontuação Composta de Qualidade',
            },
          },
        },
      },
    };


    await createChart(config, `requisito-2-maturidade-vs-qualidade`);
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
      `Resultado médio da pontuação composta: ${
        this.results.reduce((acc, curr) => acc + curr.compositeScore, 0) / this.results.length
      }`,
    );
    console.log('==============================================');
  }
}
