import { Routes } from '@angular/router';
import { DashboardComponent } from './main/dashboard/dashboard.component';
import { DashboardmapComponent } from './main/dashboardmap/dashboardmap.component';
import { AppComponent } from './app.component';
import { ReportComponent } from './main/report/report.component';

export const routes: Routes = [
	{ path: '', component: null, loadChildren: () => import('./main/main.module').then(m => m.MainModule)  }, //canActivate: [AutenticadorGuard]
	{ path: 'dashboard', component: DashboardComponent },
	{ path: 'report', component: ReportComponent },
	//{ path: 'dashboardmap', component: DashboardmapComponent },
	//{ path: 'dashboardmap', component: AppComponent, loadChildren: () => import('./main/main.module').then(m => m.MainModule)  }, //canActivate: [AutenticadorGuard]
	{ path: 'administrar', component: null, loadChildren: () => import('./administration/administration.module').then(m => m.AdministrationModule)  }, //canActivate: [AutenticadorGuard]
	{ path: 'dashboardmap', component: null, loadChildren: () => import('./main/main.module').then(m => m.MainModule)  }, //canActivate: [AutenticadorGuard]
	{ path: 'routes', component: null, loadChildren: () => import('./main/main.module').then(m => m.MainModule)  }, //canActivate: [AutenticadorGuard]
	
];
