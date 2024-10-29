import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LayoutComponent } from './layout/layout.component';
import { UsersComponent } from './users/users.component';
import { PersonalComponent } from './personal/personal.component';
import { SessionsComponent } from './sessions/sessions.component';
import { DevicesComponent } from './devices/devices.component';
import { TracksComponent } from './tracks/tracks.component';

const routes: Routes = [
	{ path: '', component: LayoutComponent },
	{ path: 'Users', component: UsersComponent },
	{ path: 'personal', component: PersonalComponent },
	{ path: 'sessions', component: SessionsComponent },
	{ path: 'devices', component: DevicesComponent },
	{ path: 'routes', component: PersonalComponent },
	{ path: 'tracks', component: TracksComponent },
	/*{ path: '', component: LayoutComponent, loadChildren: () => import('./users/users.component').then(m => m.UsersComponent )  }, //canActivate: [AutenticadorGuard]*/
	
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdministrationRoutingModule { }
