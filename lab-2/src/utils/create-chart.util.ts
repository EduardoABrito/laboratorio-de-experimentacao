import axios from 'axios';
import fs from 'fs';

export async function createChart(config, name) {
  try {
    const dir = `resultados/graficos/`;
    const url = `https://quickchart.io/chart`;
    const data  ={
      backgroundColor: 'transparent',
      width: 500,
      height: 300,
      format: 'png',
      chart: JSON.stringify(config),
    }
    const response = await axios.post(url, data, { responseType: 'arraybuffer' });

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(`${dir}/${name}.png`, response.data as Buffer);
    console.log(`Imagem do gráfico ${name} salva!`);
  } catch (e) {
    console.log(e);
  }
}
