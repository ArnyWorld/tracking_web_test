import { Observable } from "rxjs/internal/Observable";

export interface ServicioApi{

  getAll(per_page: number, page: number): Observable<any>;

  register(data: any): Observable<any>;

  delete (id: string|number): Observable<any>;

  destroy (id: string|number): Observable<any>;

  update (data: any, id:null|number|null): Observable<any>;

  search(per_page: number, page: number, search?: string, orderColumn?:string, order?:string, searchColumns?: string,): Observable<any>;

  filter(filterData, per_page: number, page: number, orderColumn: string, order: string): Observable<any>;
}
