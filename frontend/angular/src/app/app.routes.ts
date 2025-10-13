import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home';
import { MarketsComponent } from './pages/markets/markets';
import { NewsComponent } from './pages/news/news';
import { UeberunsComponent } from './pages/ueberuns/ueberuns';
import { HilfeComponent } from './pages/hilfe/hilfe';
import { EinstellungenComponent } from './pages/einstellungen/einstellungen';
import { LoginComponent } from './pages/login/login';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', component: HomeComponent, canActivate: [authGuard] },
  { path: 'login', component: LoginComponent },
  { path: 'markets', component: MarketsComponent },
  { path: 'news', component: NewsComponent },
  { path: 'ueberuns', component: UeberunsComponent },
  { path: 'hilfe', component: HilfeComponent },
  { path: 'einstellungen', component: EinstellungenComponent, canActivate: [authGuard] }
];