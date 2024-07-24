
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardmapComponent } from './dashboardmap/dashboardmap.component';
import { DashboardmappolyComponent } from './dashboardmappoly/dashboardmappoly.component';
import { RoutessectionsComponent } from './routessections/routessections.component';
import { DistrictsComponent } from './districts/districts.component';

const routes: Routes = [
	{ path: '', component: DashboardmapComponent },
	{ path: 'routesedit', component: DashboardmappolyComponent },
	{ path: 'routessections', component: RoutessectionsComponent },
	{ path: 'districts', component: DistrictsComponent },
];
//

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})

export class MainRoutingModule { }
