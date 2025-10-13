import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home';
import { Portfolio } from './pages/portfolio/portfolio';
import { MarketsComponent } from './pages/markets/markets';
import { NewsComponent } from './pages/news/news';
import { UeberunsComponent } from './pages/ueberuns/ueberuns';
import { HilfeComponent } from './pages/hilfe/hilfe';
import { EinstellungenComponent } from './pages/einstellungen/einstellungen';
import { LoginComponent } from './pages/login/login';
import { RegisterComponent } from './pages/register/register';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', component: Portfolio, canActivate: [authGuard] },
  { path: 'watchlist', component: HomeComponent, canActivate: [authGuard] },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'markets', component: MarketsComponent },
  { path: 'news', component: NewsComponent },
  { path: 'ueberuns', component: UeberunsComponent },
  { path: 'hilfe', component: HilfeComponent },
  { path: 'einstellungen', component: EinstellungenComponent, canActivate: [authGuard] }
];