import { Injectable,NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Socket } from 'ngx-socket-io';
import { SocketIoModule, SocketIoConfig } from 'ngx-socket-io';
import { MainRoutingModule } from './main-routing.module';
import { AngularOpenlayersModule } from "ng-openlayers";
import { DashboardmapComponent } from './dashboardmap/dashboardmap.component';
import { PanelFloatNavComponent } from '../panel-float-nav/panel-float-nav.component';
import { PanelRightComponent } from '../panel-right/panel-right.component';
import { TabsModule } from 'ngx-bootstrap/tabs';
import { DashboardmappolyComponent } from './dashboardmappoly/dashboardmappoly.component';
import { environment } from '../../environments/environment';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { ModalImportComponent } from './modal-import/modal-import.component';
import { ModalImportDistrictsComponent } from './modal-import-districts/modal-import-districts.component';
import { RoutessectionsComponent } from './routessections/routessections.component';
import { DistrictsComponent } from './districts/districts.component';
import { ModalImportPersonalComponent } from './modal-import-personal/modal-import-personal.component';
import { ModalImportPersonalRegistroComponent } from './modal-import-personal-registro/modal-import-personal-registro.component';
import { ModalImportRoutesComponent } from './modal-import-routes/modal-import-routes.component';
import { BotcomComponent } from './botcom/botcom.component';
import { ModalImportDevicesComponent } from './modal-import-devices/modal-import-devices.component';
import { ModalImportGeojsonComponent } from './modal-import-geojson/modal-import-geojson.component';
import { BotcomliveComponent } from './botcomlive/botcomlive.component';


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
	ModalImportDistrictsComponent,
	DashboardmappolyComponent,
	RoutessectionsComponent,
	DistrictsComponent,
	ModalImportPersonalComponent,
	ModalImportPersonalRegistroComponent,
	ModalImportRoutesComponent,
	ModalImportDevicesComponent,
	ModalImportGeojsonComponent,
	BotcomComponent,
	BotcomliveComponent,
  ],
  imports: [
	TabsModule,
    FormsModule,
    ReactiveFormsModule,
    AngularOpenlayersModule ,
    CommonModule,
    MainRoutingModule,
    SocketIoModule,
  ],
  providers: [SocketOne,BsModalService],
})
export class MainModule { }
