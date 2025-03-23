import { MetricsCkResponseDto } from 'src/service/dto/metrics-response.dto';

class RequisitosBaseResponseDto extends MetricsCkResponseDto {
  name: string;
  owner: string;
  primaryLanguage: string;
  createdAt: Date;
  updatedAt: Date;
  url: string;
  compositeScore: number;
}

export class Requisito1ResponseDto extends RequisitosBaseResponseDto {
  popularity: number;
}

export class Requisito2ResponseDto extends RequisitosBaseResponseDto {
  popularity: number;
}

export class Requisito3ResponseDto extends RequisitosBaseResponseDto {
  allReleasesCount: number;
}

export class Requisito4ResponseDto extends RequisitosBaseResponseDto {
  popularity: number;
}
