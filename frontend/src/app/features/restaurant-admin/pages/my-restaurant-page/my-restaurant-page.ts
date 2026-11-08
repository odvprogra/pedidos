import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Injector,
  OnInit,
  afterNextRender,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { toProblemDetails } from '@core/http/problem-details';
import { Alert, AlertTone } from '@shared/ui/alert/alert';
import { Button } from '@shared/ui/button/button';
import { FormField } from '@shared/ui/form-field/form-field';
import { LoadError } from '@shared/ui/load-error/load-error';
import { Spinner } from '@shared/ui/spinner/spinner';
import { TextInput } from '@shared/ui/text-input/text-input';
import { applyFieldErrors } from '@shared/utils/field-errors';
import { focusFirstInvalid } from '@shared/utils/focus-first-invalid';
import { ValidationMessages, validationMessage } from '@shared/utils/validation-message';
import { map } from 'rxjs';
import { RegistrationSteps } from '../../components/registration-steps/registration-steps';
import { RestaurantCard } from '../../components/restaurant-card/restaurant-card';
import { CatalogApi } from '../../data-access/catalog-api';
import { RestaurantApi } from '../../data-access/restaurant-api';
import { Catalog, summarize } from '../../models/catalog';
import { Restaurant } from '../../models/restaurant';
import {
  describeRestaurantError,
  isAlreadyRegistered,
  isNotRegistered,
  isSuspended,
} from '../../models/restaurant-error';
import { openingDone } from '../../models/restaurant-status';

type PageState =
  | { status: 'loading' }
  | { status: 'missing' }
  | { status: 'failed'; message: string }
  | { status: 'ready'; restaurant: Restaurant };

type RegistrationField = 'name' | 'description' | 'address';

interface Notice {
  tone: AlertTone;
  message: string;
}

const DESCRIPTION_LIMIT = 300;

const MESSAGES: Record<RegistrationField, ValidationMessages> = {
  name: {
    required: 'Escribe el nombre de tu restaurante.',
    pattern: 'Escribe el nombre de tu restaurante.',
    maxlength: 'Usa hasta 120 caracteres.',
  },
  description: {
    maxlength: `Usa hasta ${DESCRIPTION_LIMIT} caracteres.`,
  },
  address: {
    required: 'Escribe dónde queda tu restaurante.',
    pattern: 'Escribe dónde queda tu restaurante.',
    maxlength: 'Usa hasta 200 caracteres.',
  },
};

@Component({
  selector: 'app-my-restaurant-page',
  imports: [
    ReactiveFormsModule,
    Alert,
    Button,
    FormField,
    LoadError,
    RegistrationSteps,
    RestaurantCard,
    Spinner,
    TextInput,
  ],
  templateUrl: './my-restaurant-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MyRestaurantPage implements OnInit {
  private readonly restaurantApi = inject(RestaurantApi);
  private readonly catalogApi = inject(CatalogApi);
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);
  private readonly heading = viewChild<ElementRef<HTMLElement>>('heading');
  private readonly loadError = viewChild(LoadError);
  private readonly menu = signal<Catalog | null>(null);

  protected readonly descriptionLimit = DESCRIPTION_LIMIT;
  protected readonly state = signal<PageState>({ status: 'loading' });
  protected readonly notice = signal<Notice | null>(null);
  protected readonly submitting = signal(false);
  protected readonly formAlert = signal<string | null>(null);
  protected readonly toggling = signal(false);
  protected readonly menuSummary = computed(() => {
    const menu = this.menu();
    return menu ? summarize(menu) : null;
  });
  protected readonly form = this.formBuilder.group({
    name: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(120)]],
    description: ['', Validators.maxLength(DESCRIPTION_LIMIT)],
    address: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(200)]],
  });
  protected readonly descriptionLength = toSignal(
    this.form.controls.description.valueChanges.pipe(map((description) => description.length)),
    { initialValue: 0 },
  );
  protected readonly registering = computed(() => this.state().status === 'missing');
  protected readonly title = computed(() =>
    this.registering() ? 'Registra tu restaurante' : 'Mi restaurante',
  );
  protected readonly subtitle = computed(() => {
    const current = this.state();
    if (current.status === 'missing') {
      return 'Completa los datos de tu local para empezar. Te toma un minuto.';
    }
    if (current.status === 'ready' && current.restaurant.suspended) {
      return 'Revisa en qué estado está tu restaurante.';
    }
    return 'Mira cómo te ven tus clientes y decide cuándo recibir pedidos.';
  });

  ngOnInit(): void {
    this.load(false);
  }

  protected errorOf(field: RegistrationField): string | null {
    return validationMessage(this.form.controls[field], MESSAGES[field]);
  }

  protected retry(): void {
    this.load(true);
  }

  protected register(): void {
    if (this.submitting()) {
      return;
    }
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      focusFirstInvalid(this.host.nativeElement, this.injector);
      return;
    }

    this.submitting.set(true);
    this.formAlert.set(null);
    this.restaurantApi.register(this.form.getRawValue()).subscribe({
      next: (restaurant) => {
        this.submitting.set(false);
        this.state.set({ status: 'ready', restaurant });
        this.menu.set({ categories: [] });
        this.notice.set({
          tone: 'success',
          message: `¡Listo! Registraste ${restaurant.name}. Está cerrado: ábrelo cuando quieras recibir pedidos.`,
        });
        this.focusHeading();
      },
      error: (error: unknown) => {
        this.submitting.set(false);
        const problem = toProblemDetails(error);
        if (isAlreadyRegistered(problem)) {
          this.notice.set({
            tone: 'warning',
            message: 'Ya tenías un restaurante registrado. Te mostramos sus datos.',
          });
          this.load(true);
          return;
        }
        applyFieldErrors(this.form, problem.errors ?? []);
        this.formAlert.set(describeRestaurantError(problem));
        focusFirstInvalid(this.host.nativeElement, this.injector);
      },
    });
  }

  protected changeOpening(open: boolean): void {
    const current = this.state();
    if (current.status !== 'ready' || this.toggling()) {
      return;
    }
    const restaurant = current.restaurant;
    this.toggling.set(true);
    const request = open ? this.restaurantApi.open() : this.restaurantApi.close();
    request.subscribe({
      next: () => {
        this.toggling.set(false);
        this.state.set({ status: 'ready', restaurant: { ...restaurant, open } });
        this.notice.set({ tone: 'success', message: openingDone(open, restaurant.name) });
      },
      error: (error: unknown) => {
        this.toggling.set(false);
        const problem = toProblemDetails(error);
        const outdated = isSuspended(problem) || isNotRegistered(problem);
        this.notice.set({
          tone: outdated ? 'warning' : 'danger',
          message: describeRestaurantError(problem),
        });
        if (outdated) {
          this.load(true);
        }
      },
    });
  }

  private load(moveFocus: boolean): void {
    this.state.set({ status: 'loading' });
    this.restaurantApi.mine().subscribe({
      next: (restaurant) => {
        this.show({ status: 'ready', restaurant }, moveFocus);
        this.loadMenu();
      },
      error: (error: unknown) => {
        const problem = toProblemDetails(error);
        this.show(
          isNotRegistered(problem)
            ? { status: 'missing' }
            : { status: 'failed', message: describeRestaurantError(problem) },
          moveFocus,
        );
      },
    });
  }

  private loadMenu(): void {
    this.menu.set(null);
    this.catalogApi.mine().subscribe({
      next: (menu) => this.menu.set(menu),
      error: () => this.menu.set(null),
    });
  }

  private show(state: PageState, moveFocus: boolean): void {
    this.state.set(state);
    if (state.status !== 'ready') {
      this.notice.set(null);
    }
    if (!moveFocus) {
      return;
    }
    if (state.status === 'failed') {
      this.focusRetry();
    } else {
      this.focusHeading();
    }
  }

  private focusHeading(): void {
    afterNextRender(() => this.heading()?.nativeElement.focus(), { injector: this.injector });
  }

  private focusRetry(): void {
    afterNextRender(() => this.loadError()?.focus(), { injector: this.injector });
  }
}
