import { test } from '@playwright/test';

import { testCardMoxDiamond, testCardSoldierOfFortune } from '../playwrightData/cardData';
import { addRemoveCube, existingCubeData, newCubeData } from '../playwrightData/cubeData';
import { testUser1 } from '../playwrightData/testUsers';
import { CubeListPage } from '../playwrightPageObjects/CubeListPage';
import { CubeOverviewPage } from '../playwrightPageObjects/CubeOverviewPage';
import { DashboardPage } from '../playwrightPageObjects/DashboardPage';
import { SearchPage } from '../playwrightPageObjects/SearchPage';
import { TopNavigationPage } from '../playwrightPageObjects/topNavigationPage';

test.skip('should login and create a new cube from the navigation bar', async ({ page }) => {
  await page.goto('/');

  const topNavigationPage = new TopNavigationPage(page);
  await topNavigationPage.userLogin({ testUser1 });
  // Not working yet. Need a way to bypass captcha
  await topNavigationPage.clickCreateANewCube(newCubeData.title);
});

test('should successuflly use the card search page', async ({ page }) => {
  await page.goto('/');

  const topNavigationPage = new TopNavigationPage(page);
  await topNavigationPage.clickSearchCard();

  const searchPage = new SearchPage(page);
  await searchPage.searchCard(testCardSoldierOfFortune.name);
});

test('should open cube from Your Cube dashboard section, then click and validate cube overview and description', async ({
  page,
}) => {
  await page.goto('/');

  const topNavigationPage = new TopNavigationPage(page);
  await topNavigationPage.userLogin({ testUser1 });

  const dashboardPage = new DashboardPage(page);
  await dashboardPage.validateTestCubeDisplays(
    existingCubeData.title,
    existingCubeData.cardCount,
    existingCubeData.followerCount,
  );
  await dashboardPage.clickCubeFromYourCube(
    existingCubeData.title,
    existingCubeData.cardCount,
    existingCubeData.followerCount,
  );

  const cubeOverviewPage = new CubeOverviewPage(page);
  await cubeOverviewPage.validateCubeDescription(existingCubeData.description);
});

test('should add and remove two cards from cube then validate change log blog post', async ({ page }) => {
  await page.goto('/');

  const topNavigationPage = new TopNavigationPage(page);
  await topNavigationPage.userLogin({ testUser1 });

  const dashboardPage = new DashboardPage(page);
  await dashboardPage.clickCubeFromYourCube(addRemoveCube.title, addRemoveCube.cardCount, addRemoveCube.followerCount);

  const cubeOverviewPage = new CubeOverviewPage(page);
  await cubeOverviewPage.clickList();

  const cubeListPage = new CubeListPage(page);
  await cubeListPage.addToCube(testCardSoldierOfFortune.name, testCardMoxDiamond.name);
  await cubeListPage.removeFromCube(testCardSoldierOfFortune.name, testCardMoxDiamond.name);
  await cubeListPage.clickOverview();
  await cubeOverviewPage.validateChangeLog(0, 2, 'Mox DiamondSoldier of Fortune');
});
