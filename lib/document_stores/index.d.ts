export interface Store {
	// connect(...args: any[]): any;

	set(...args: any[]): any;
	get(...args: any[]): Promise<any>;
}
