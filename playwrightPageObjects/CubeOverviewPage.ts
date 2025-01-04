export class CubeOverviewPage {
  page: any;
  cubeDescription: any;
  listLink: any;
  cardCount: any;
  blogPostNuetralChangeLog: any;
  blogPostRemovedChangeLog: any;
  blogPostAddedChangeLog: any;
  blogPostChangeLog: (added: number, removed: number, cards: string) => any;

  constructor(page: any) {
    this.page = page;

    this.listLink = page.getByRole('link', { name: 'List' });
    this.cardCount = page.getByText('1 Card Cube', { exact: true });
    this.blogPostChangeLog = (added: number, removed: number, cards: string) => {
      return this.page
        .locator('div')
        .filter({ hasText: `Mainboard Changelist+${added}, -${removed}${cards}` })
        .nth(1);
    };
  }
  // Validates cube description passed as an argmument displays on the overview page
  validateCubeDescription = async (text) => {
    this.cubeDescription = this.page.locator('div').filter({ hasText: text }).first();
    await this.cubeDescription.waitFor();
  };
  // Clicks List link from the Cube Overview page
  clickList = async () => {
    await this.listLink.waitFor();
    await this.listLink.click();
    await this.page.waitForURL(/\/list/);
  };
  validateChangeLog = async (added: number, removed: number, cards: string) => {
    //await this.page.pause();
    const changeLog = this.blogPostChangeLog(added, removed, cards);
    await changeLog.waitFor();
  };
}
