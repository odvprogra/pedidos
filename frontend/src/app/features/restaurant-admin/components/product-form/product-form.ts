import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Injector,
  OnInit,
  afterNextRender,
  effect,
  inject,
  input,
  output,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { FieldViolation } from '@core/http/problem-details';
import { Alert } from '@shared/ui/alert/alert';
import { Button } from '@shared/ui/button/button';
import { SecondaryButton } from '@shared/ui/button/secondary-button';
import { FormField } from '@shared/ui/form-field/form-field';
import { Spinner } from '@shared/ui/spinner/spinner';
import { TextInput } from '@shared/ui/text-input/text-input';
import { applyFieldErrors } from '@shared/utils/field-errors';
import { focusFirstInvalid } from '@shared/utils/focus-first-invalid';
import { ValidationMessages, validationMessage } from '@shared/utils/validation-message';
import { map } from 'rxjs';
import { Category, Product, ProductDraft } from '../../models/catalog';
import { parsePrice, priceText, priceValidator } from '../../models/price';

type ProductField = 'name' | 'description' | 'price' | 'imageUrl';

const DESCRIPTION_LIMIT = 300;
const IMAGE_URL_LIMIT = 500;
const WEB_ADDRESS = /^\s*(https?:\/\/\S+)?\s*$/i;

const MESSAGES: Record<ProductField, ValidationMessages> = {
  name: {
    required: 'Escribe el nombre del producto.',
    pattern: 'Escribe el nombre del producto.',
    maxlength: 'Usa hasta 120 caracteres.',
  },
  description: {
    maxlength: `Usa hasta ${DESCRIPTION_LIMIT} caracteres.`,
  },
  price: {
    required: 'Escribe el precio.',
    priceFormat: 'Escribe el precio con números, como 45 o 45,50.',
    pricePositive: 'El precio tiene que ser mayor a cero.',
  },
  imageUrl: {
    pattern: 'Pega una dirección que empiece con http:// o https://.',
    maxlength: `Usa hasta ${IMAGE_URL_LIMIT} caracteres.`,
  },
};

@Component({
  selector: 'app-product-form',
  imports: [ReactiveFormsModule, Alert, Button, FormField, SecondaryButton, Spinner, TextInput],
  templateUrl: './product-form.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductForm implements OnInit {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);

  readonly categories = input.required<readonly Category[]>();
  readonly categoryId = input.required<number>();
  readonly product = input<Product | null>(null);
  readonly saving = input(false);
  readonly errors = input<readonly FieldViolation[]>([]);
  readonly alert = input<string | null>(null);
  readonly save = output<ProductDraft>();
  readonly cancelled = output();

  protected readonly descriptionLimit = DESCRIPTION_LIMIT;
  protected readonly form = inject(NonNullableFormBuilder).group({
    categoryId: [0],
    name: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(120)]],
    description: ['', Validators.maxLength(DESCRIPTION_LIMIT)],
    price: ['', [Validators.required, priceValidator]],
    imageUrl: ['', [Validators.pattern(WEB_ADDRESS), Validators.maxLength(IMAGE_URL_LIMIT)]],
  });
  protected readonly descriptionLength = toSignal(
    this.form.controls.description.valueChanges.pipe(map((description) => description.length)),
    { initialValue: 0 },
  );

  constructor() {
    effect(() => {
      const errors = this.errors();
      if (errors.length > 0) {
        applyFieldErrors(this.form, errors);
        focusFirstInvalid(this.host.nativeElement, this.injector);
      }
    });
    afterNextRender(() =>
      this.host.nativeElement.querySelector<HTMLElement>('#product-name')?.focus(),
    );
  }

  ngOnInit(): void {
    const product = this.product();
    this.form.setValue(
      product
        ? {
            categoryId: product.categoryId,
            name: product.name,
            description: product.description ?? '',
            price: priceText(product.price),
            imageUrl: product.imageUrl ?? '',
          }
        : {
            categoryId: this.categoryId(),
            name: '',
            description: '',
            price: '',
            imageUrl: '',
          },
    );
  }

  protected title(): string {
    const product = this.product();
    return product ? `Editar ${product.name}` : 'Nuevo producto';
  }

  protected submitLabel(): string {
    return this.product() ? 'Guardar cambios' : 'Agregar producto';
  }

  protected errorOf(field: ProductField): string | null {
    return validationMessage(this.form.controls[field], MESSAGES[field]);
  }

  protected submit(): void {
    if (this.saving()) {
      return;
    }
    this.form.markAllAsTouched();
    const value = this.form.getRawValue();
    const price = parsePrice(value.price);
    if (this.form.invalid || price === null) {
      focusFirstInvalid(this.host.nativeElement, this.injector);
      return;
    }
    this.save.emit({
      categoryId: value.categoryId,
      name: value.name.trim(),
      description: value.description.trim(),
      price,
      imageUrl: value.imageUrl.trim(),
    });
  }
}
