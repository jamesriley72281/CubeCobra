export class CubeListPage {
  page: any;
  removeFromCubeButton: any;
  saveChangeButton: any;
  editLink: any;
  cardToAddField: any;
  addButton: any;
  overviewLink: any;
  cubeCard: any;

  constructor(page: any) {
    this.page = page;

    this.removeFromCubeButton = page.getByRole('button', { name: 'Remove from cube' });
    this.saveChangeButton = page.getByRole('button', { name: 'Save Changes' });
    this.editLink = page.getByText('Edit').first();
    this.cardToAddField = page.getByPlaceholder('Card to Add');
    this.addButton = page.getByRole('button', { name: 'Add' });
    this.overviewLink = page.getByRole('link', { name: 'Overview' });
  }

  // Click card on cube list by passing card name as an argument
  clickCard = async (cardName: string) => {
    this.cubeCard = this.page
      .locator('div')
      .filter({ hasText: new RegExp(`^${cardName}$`) })
      .first();
    await this.cubeCard.waitFor();
    await this.cubeCard.click();
  };

  // Remove cards from the cube by passing card names as an argument
  removeFromCube = async (name: string, ...cardNames: string[]) => {
    const cards = [name, ...cardNames];
    await this.editLink.waitFor();
    await this.editLink.click();

    for (const cardName of cards) {
      await this.clickCard(cardName);
      await this.removeFromCubeButton.waitFor();
      await this.removeFromCubeButton.click();
      await this.page.waitForTimeout(500); // Adjust timeout if necessary
    }
    await this.saveChangeButton.waitFor();
    await this.saveChangeButton.click();
    await this.editLink.click();
  };

  // Add cards to cube by passing card names as an argument
  addToCube = async (name: string, ...cardNames: string[]) => {
    const cards = [name, ...cardNames];
    await this.editLink.waitFor();
    await this.editLink.click();

    for (const cardName of cards) {
      await this.cardToAddField.fill(cardName);
      await this.addButton.waitFor();
      await this.addButton.click();
      await this.page.waitForTimeout(500); // Adjust timeout if necessary
    }
    await this.saveChangeButton.waitFor();
    await this.saveChangeButton.click();
    await this.editLink.click();
  };

  // Clicks the Overview link from the Cube List page
  clickOverview = async () => {
    await this.overviewLink.waitFor();
    await this.overviewLink.click();
    await this.page.waitForURL(/\/overview/);
  };
}
