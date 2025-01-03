import { Page } from 'playwright';

export async function getYourCube(page: Page, name: string, cards: string, followers: string) {
  // TODO: add QA selector to the element below so we can use a less brittle selector.
  return page.getByRole('link', { name: `${name} ${cards} Card Cube ${followers}` });
}
