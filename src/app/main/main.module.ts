import { Injectable,NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Socket } from 'ngx-socket-io';
import { SocketIoModule, SocketIoConfig } from 'ngx-socket-io';
import { MainRoutingModule } from './main-routing.module';
import { AngularOpenlayersModule} from "ng-openlayers";
import { DashboardmapComponent } from './dashboardmap/dashboardmap.component';
import { PanelFloatNavComponent } from '../panel-float-nav/panel-float-nav.component';
import { PanelRightComponent } from '../panel-right/panel-right.component';
import { TabsModule } from 'ngx-bootstrap/tabs';
import { DashboardmappolyComponent } from './dashboardmappoly/dashboardmappoly.component';
import { environment } from '../../environments/environment';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { ModalImportComponent } from './modal-import/modal-import.component';
import { RoutessectionsComponent } from './routessections/routessections.component';
import { DistrictsComponent } from './districts/districts.component';

@Injectable()
export class SocketOne extends Socket {
  constructor() {
    super({ url: environment.wsserver, options: {} });
  }
}

@NgModule({
  declarations: [
    DashboardmapComponent,
	PanelFloatNavComponent,
	PanelRightComponent,
	ModalImportComponent,
	DashboardmappolyComponent,
	RoutessectionsComponent,
	DistrictsComponent,
  ],
  imports: [
	TabsModule,
    FormsModule,
    ReactiveFormsModule,
    AngularOpenlayersModule,
    CommonModule,
    MainRoutingModule,
    SocketIoModule,
  ],
  providers: [SocketOne,BsModalService],
})
export class MainModule { }
