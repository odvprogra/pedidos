import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CoverImage } from './cover-image';

describe('CoverImage', () => {
  let fixture: ComponentFixture<CoverImage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(CoverImage);
  });

  function image(): HTMLImageElement | null {
    return (fixture.nativeElement as HTMLElement).querySelector('img');
  }

  async function show(src: string | null): Promise<void> {
    fixture.componentRef.setInput('src', src);
    await fixture.whenStable();
  }

  it('shows the image as decoration, since the name is always next to it', async () => {
    await show('https://fotos.pedidos.test/casona.jpg');

    expect(image()?.getAttribute('src')).toBe('https://fotos.pedidos.test/casona.jpg');
    expect(image()?.getAttribute('alt')).toBe('');
    expect(image()?.getAttribute('loading')).toBe('lazy');
  });

  it('shows nothing without an image, so the placeholder behind it stays in view', async () => {
    await show(null);

    expect(image()).toBeNull();
  });

  it('hides an image that cannot load', async () => {
    await show('https://fotos.pedidos.test/rota.jpg');

    image()?.dispatchEvent(new Event('error'));
    await fixture.whenStable();

    expect(image()).toBeNull();
  });

  it('tries again when the image changes after one failed', async () => {
    await show('https://fotos.pedidos.test/rota.jpg');
    image()?.dispatchEvent(new Event('error'));
    await fixture.whenStable();

    await show('https://fotos.pedidos.test/casona.jpg');

    expect(image()?.getAttribute('src')).toBe('https://fotos.pedidos.test/casona.jpg');
  });
});
