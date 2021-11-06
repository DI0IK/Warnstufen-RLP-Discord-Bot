import axios from 'axios';
import https from 'https';

export default class DataClass {
	public static async getData(): Promise<Data> {
		return new Promise((resolve, reject) => {
			axios
				.get('https://www.warnzahl-rlp.de/api/v2/data', {
					responseType: 'json',
				})
				.then((response) => {
					resolve(response.data.data);
				});
		});
	}

	public static async getDistricts(): Promise<string[]> {
		return new Promise((resolve, reject) => {
			axios
				.get('https://www.warnzahl-rlp.de/api/v2/districts', {
					responseType: 'json',
				})
				.then((response) => {
					resolve(response.data);
				});
		});
	}
}

interface Data {
	[lk: string]: {
		[date: string]: {
			Inzidenz7Tage: number;
			Hospitalisierung7Tage: number;
			IntensivbettenProzent: number;
			Warnstufe: number;
		};
	};
}
