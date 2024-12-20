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
import { ModalImportRoutesMultiComponent } from './modal-import-routes-multi/modal-import-routes-multi.component';
import { BotcomliveComponent } from './botcomlive/botcomlive.component';
import { ModalImportAssignmentsComponent } from './modal-import-assignations/modal-import-assignments.component';
import { ModalImportReportComponent } from './modal-import-report/modal-import-report.component';
import { ModalDeviceConfigComponent } from './modal-device-config/modal-device-config.component';
import { TracksComponent } from '../administration/tracks/tracks.component';
import { TrackplayerComponent } from "./trackplayer/trackplayer.component";
import { TrackplayermapComponent } from './trackplayermap/trackplayermap.component';
import { ReportComponent } from './report/report.component';

@Injectable()
export class SocketOne extends Socket {
  constructor() {
    super({ url: environment.wsserver, options: {} });
  }
}

@NgModule({
  declarations: [
	ReportComponent,
    DashboardmapComponent,
	PanelFloatNavComponent,
	PanelRightComponent,
	ModalImportComponent,
	ModalImportDistrictsComponent,
	DashboardmappolyComponent,
	RoutessectionsComponent,
	DistrictsComponent,
	ModalDeviceConfigComponent,
	ModalImportPersonalComponent,
	ModalImportPersonalRegistroComponent,
	ModalImportRoutesComponent,
	ModalImportRoutesMultiComponent,
	ModalImportDevicesComponent,
	ModalImportGeojsonComponent,
	ModalImportAssignmentsComponent,
	ModalImportReportComponent,
	BotcomComponent,
	TrackplayerComponent,
	BotcomliveComponent,
	TrackplayermapComponent,
  ],
  imports: [
    TabsModule,
    FormsModule,
    ReactiveFormsModule,
    AngularOpenlayersModule,
    CommonModule,
    MainRoutingModule,
    SocketIoModule
],
  providers: [SocketOne,BsModalService],
})
export class MainModule { }
