import Canvas from 'canvas';

export function createGraph(
	dates: string[],
	values: {
		Inzidenz7Tage: number;
		Hospitalisierung7Tage: number;
		IntensivbettenProzent: number;
		Warnstufe: number;
	}[],
	colors: {
		color: string;
		minValue: number;
	}[]
): Promise<Buffer> {
	const graph = new Graph(dates, values, colors);
	return graph.render();
}

class Graph {
	private dates: string[];
	private values: {
		Inzidenz7Tage: number;
		Hospitalisierung7Tage: number;
		IntensivbettenProzent: number;
		Warnstufe: number;
	}[];
	private colors: {
		color: string;
		minValue: number;
	}[];

	constructor(
		dates: string[],
		values: {
			Inzidenz7Tage: number;
			Hospitalisierung7Tage: number;
			IntensivbettenProzent: number;
			Warnstufe: number;
		}[],
		colors: {
			color: string;
			minValue: number;
		}[]
	) {
		this.dates = dates.reverse();
		this.values = values.reverse();
		this.colors = colors;
	}

	public render(): Promise<Buffer> {
		return new Promise((resolve, reject) => {
			const canvas = new Canvas.Canvas(800, 600);
			const ctx = canvas.getContext('2d');
			ctx.fillStyle = '#fff';
			ctx.fillRect(0, 0, 800, 600);
			ctx.fillStyle = '#000';
			ctx.font = '12px Arial';
			ctx.textAlign = 'center';
			ctx.textBaseline = 'middle';

			const maxValue = Math.max(
				...this.values.map((value) => value.Inzidenz7Tage),
				...this.values.map((value) => value.Hospitalisierung7Tage),
				...this.values.map((value) => value.IntensivbettenProzent)
			);

			const stepcount = 5;

			const step = maxValue / stepcount;

			// Horizontal lines
			for (let i = 0; i < 6; i++) {
				const y = 50 + (i * (550 - 50)) / 5;
				ctx.beginPath();
				ctx.moveTo(50, y);
				ctx.lineTo(750, y);
				ctx.stroke();
			}

			// Vertical lines
			for (let i = 0; i < 6; i++) {
				const x = 50 + (i * (750 - 50)) / 5;
				ctx.beginPath();
				ctx.moveTo(x, 50);
				ctx.lineTo(x, 550);
				ctx.stroke();
			}

			// Horizontal labels (left)
			for (let i = 0; i <= stepcount; i++) {
				const y = 50 + (i * (550 - 50)) / 5;
				ctx.fillText((Math.round((maxValue - step * i) * 100) / 100).toString(), 20, y);
			}
			// Horizontal label Description (top Left)
			ctx.fillText('Wert', 20, 20);

			// Horizontal labels (right) / 10
			for (let i = 0; i <= stepcount; i++) {
				const y = 50 + (i * (550 - 50)) / 5;
				ctx.fillText((Math.round((maxValue - step * i) * 10) / 100).toString(), 780, y);
			}
			// Horizontal label Description (top Right)
			ctx.fillText('Wert', 780, 20);

			// Vertical labels
			for (let i = 0; i <= stepcount; i++) {
				const x = 50 + (i * (750 - 50)) / 5;
				ctx.fillText(this.dates[Math.floor(((this.dates.length - 1) / stepcount) * i)], x, 580);
			}
			// Vertical label Description (bottom middle)
			ctx.fillText('Datum', 400, 580);

			for (const item of ['Inzidenz7Tage', 'Hospitalisierung7Tage', 'IntensivbettenProzent']) {
				const values = this.values
					.map((value) => (value as any)[item])
					.map((v) => (item === 'Inzidenz7Tage' ? v : v * 10));

				// Draw Lines
				ctx.lineWidth = 2;
				let lastY = 0,
					lastX = 0;
				for (let i = 0; i < values.length; i++) {
					ctx.strokeStyle =
						this.colors
							.sort((a, b) => {
								return b.minValue - a.minValue;
							})
							.find((color) => color.minValue <= this.values[i].Warnstufe)?.color || '#000';
					ctx.beginPath();
					const x = 50 + (i * (750 - 50)) / this.values.length;
					const y = 550 - (values[i] * (550 - 50)) / maxValue;
					if (i !== 0) {
						ctx.moveTo(lastX, lastY);
						ctx.lineTo(x, y);
					}
					lastY = y;
					lastX = x;
					ctx.stroke();
				}

				// Add Label to Line
				ctx.fillStyle = '#000';
				ctx.fillText(
					item === 'Inzidenz7Tage'
						? 'Inzidenz'
						: item === 'Hospitalisierung7Tage'
						? 'Hospitalisierung'
						: 'Intensivbetten',
					lastX,
					lastY - 10
				);
			}

			resolve(canvas.toBuffer());
		});
	}
}
