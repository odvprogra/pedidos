import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  Injector,
  afterNextRender,
  effect,
  inject,
  input,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Router, RouterLink } from '@angular/router';
import { toProblemDetails } from '@core/http/problem-details';
import { Button } from '@shared/ui/button/button';
import { LoadError } from '@shared/ui/load-error/load-error';
import { Subscription, forkJoin } from 'rxjs';
import { MenuItem } from '../../components/menu-item/menu-item';
import { RestaurantProfile } from '../../components/restaurant-profile/restaurant-profile';
import { RestaurantApi } from '../../data-access/restaurant-api';
import { Catalog } from '../../models/catalog';
import { Restaurant, parseRestaurantId } from '../../models/restaurant';
import { isRestaurantMissing } from '../../models/restaurant-error';

type PageState =
  | { status: 'loading' }
  | { status: 'missing' }
  | { status: 'failed'; message: string }
  | { status: 'ready'; restaurant: Restaurant; catalog: Catalog };

const MENU_TITLE = 'Menú | Pedidos';
const MISSING_TITLE = 'Restaurante no encontrado | Pedidos';

@Component({
  selector: 'app-restaurant-menu-page',
  imports: [RouterLink, Button, LoadError, MenuItem, RestaurantProfile],
  templateUrl: './restaurant-menu-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RestaurantMenuPage {
  private readonly restaurantApi = inject(RestaurantApi);
  private readonly title = inject(Title);
  private readonly injector = inject(Injector);
  private readonly profile = viewChild(RestaurantProfile);
  private readonly missingHeading = viewChild<ElementRef<HTMLElement>>('missingHeading');
  private readonly loadError = viewChild(LoadError);
  private readonly arrivedFromAnotherPage = Boolean(
    inject(Router).currentNavigation()?.previousNavigation,
  );
  private request: Subscription | null = null;
  private loads = 0;

  readonly id = input.required<string>();

  protected readonly placeholders = [1, 2];
  protected readonly state = signal<PageState>({ status: 'loading' });

  constructor() {
    effect(() => {
      const id = this.id();
      untracked(() => this.load(id, this.loads > 0 || this.arrivedFromAnotherPage));
    });
    inject(DestroyRef).onDestroy(() => this.request?.unsubscribe());
  }

  protected retry(): void {
    this.load(this.id(), true);
  }

  private load(idText: string, moveFocus: boolean): void {
    this.loads += 1;
    this.request?.unsubscribe();
    const id = parseRestaurantId(idText);
    if (id === null) {
      this.show({ status: 'missing' }, moveFocus);
      return;
    }
    this.state.set({ status: 'loading' });
    this.request = forkJoin({
      restaurant: this.restaurantApi.get(id),
      catalog: this.restaurantApi.catalog(id),
    }).subscribe({
      next: ({ restaurant, catalog }) =>
        this.show({ status: 'ready', restaurant, catalog }, moveFocus),
      error: (error: unknown) => {
        const problem = toProblemDetails(error);
        this.show(
          isRestaurantMissing(problem)
            ? { status: 'missing' }
            : { status: 'failed', message: problem.detail },
          moveFocus,
        );
      },
    });
  }

  private show(state: PageState, moveFocus: boolean): void {
    this.state.set(state);
    this.title.setTitle(this.titleOf(state));
    if (moveFocus) {
      afterNextRender(() => this.focus(state), { injector: this.injector });
    }
  }

  private titleOf(state: PageState): string {
    if (state.status === 'ready') {
      return `${state.restaurant.name} | Pedidos`;
    }
    return state.status === 'missing' ? MISSING_TITLE : MENU_TITLE;
  }

  private focus(state: PageState): void {
    if (state.status === 'ready') {
      this.profile()?.focus();
    } else if (state.status === 'missing') {
      this.missingHeading()?.nativeElement.focus();
    } else {
      this.loadError()?.focus();
    }
  }
}
