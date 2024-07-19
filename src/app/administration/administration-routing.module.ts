import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LayoutComponent } from './layout/layout.component';
import { UsersComponent } from './users/users.component';
import { PersonalComponent } from './personal/personal.component';

const routes: Routes = [
	{ path: '', component: LayoutComponent },
	{ path: 'Users', component: UsersComponent },
	{ path: 'personal', component: PersonalComponent },
	{ path: 'routes', component: PersonalComponent },
	/*{ path: '', component: LayoutComponent, loadChildren: () => import('./users/users.component').then(m => m.UsersComponent )  }, //canActivate: [AutenticadorGuard]*/
	
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdministrationRoutingModule { }
