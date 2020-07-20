import React, { useState, useMemo, useRef } from 'react';
import PropTypes from 'prop-types';

import { Card, CardBody, CardHeader, CardTitle, Collapse, Nav, Navbar, Button, Col, Row, Input } from 'reactstrap';

import Location from 'utils/DraftLocation';
import { cardType, cardIsSpecialZoneType } from 'utils/Card';

import CustomImageToggler from 'components/CustomImageToggler';
import DeckStacks from 'components/DeckStacks';
import { DisplayContextProvider } from 'components/DisplayContext';
import DndProvider from 'components/DndProvider';
import FoilCardImage from 'components/FoilCardImage';
import DynamicFlash from 'components/DynamicFlash';
import ErrorBoundary from 'components/ErrorBoundary';
import CubeLayout from 'layouts/CubeLayout';
import CSRFForm from 'components/CSRFForm';
import { csrfFetch } from 'utils/CSRF';

import { createSeen, addSeen, initGridDraft, buildGridDraftDeck } from 'utils/Draft';
import { unWeightedRating } from 'utils/draftbots';

export const subtitle = (cards) => {
  const numCards = cards.length;
  const numLands = cards.filter((card) => cardType(card).includes('land')).length;
  const numNonlands = cards.filter((card) => !cardType(card).includes('land') && !cardIsSpecialZoneType(card)).length;
  const numCreatures = cards.filter((card) => cardType(card).includes('creature')).length;
  const numNonCreatures = numNonlands - numCreatures;
  return (
    `${numCards} card${numCards === 1 ? '' : 's'}: ` +
    `${numLands} land${numLands === 1 ? '' : 's'}, ` +
    `${numNonlands} nonland: ` +
    `${numCreatures} creature${numCreatures === 1 ? '' : 's'}, ` +
    `${numNonCreatures} noncreature${numNonCreatures === 1 ? '' : 's'}`
  );
};

const Pack = ({ pack, packNumber, pickNumber, pickRow, pickCol }) => (
  <Card className="mt-3">
    <CardHeader>
      <CardTitle className="mb-0">
        <h4 className="mb-0">
          Pack {packNumber}, Pick {pickNumber}
        </h4>
      </CardTitle>
    </CardHeader>
    <CardBody>
      <Row className="mb-2 justify-content-center">
        <Col xs="1" />
        {[0, 1, 2].map((col) => (
          <Col key={`col-btn-${col}`} xs="3" md="2">
            <Button block outline color="success" onClick={() => pickCol(col)}>
              🡇
            </Button>
          </Col>
        ))}
      </Row>
      {[0, 1, 2].map((row) => (
        <Row key={`row-${row}`} className="justify-content-center">
          <Col className="my-2" xs="1">
            <Button className="float-right h-100" outline color="success" onClick={() => pickRow(row)}>
              🡆
            </Button>
          </Col>
          {[0, 1, 2].map((col) => (
            <Col key={`cell-${col}-${row}`} className="px-0" xs="3" md="2">
              {pack[row * 3 + col] ? (
                <FoilCardImage card={pack[row * 3 + col]} tags={[]} autocard />
              ) : (
                <img
                  src="/content/default_card.png"
                  alt="Empty card slot"
                  width="100%"
                  height="auto"
                  className="card-border"
                />
              )}
            </Col>
          ))}
        </Row>
      ))}
    </CardBody>
  </Card>
);

Pack.propTypes = {
  pack: PropTypes.arrayOf(PropTypes.object).isRequired,
  packNumber: PropTypes.number.isRequired,
  pickNumber: PropTypes.number.isRequired,
  pickRow: PropTypes.func.isRequired,
  pickCol: PropTypes.func.isRequired,
};

const seen = createSeen();
const picked = createSeen();

const options = [];

for (let index = 0; index < 3; index++) {
  let mask = [];
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      if (i === index) {
        mask.push(true);
      } else {
        mask.push(false);
      }
    }
  }
  options.push(mask);

  mask = [];
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      if (j === index) {
        mask.push(true);
      } else {
        mask.push(false);
      }
    }
  }
  options.push(mask);
}

const GridDraftPage = ({ cube, cubeID, initialDraft }) => {
  useMemo(() => initGridDraft(initialDraft), [initialDraft]);

  const [pack, setPack] = useState(initialDraft.unopenedPacks[0]);
  const [packNumber, setPackNumber] = useState(1);
  const [pickNumber, setPickNumber] = useState(1);
  const [picks, setPicks] = useState([[[], [], [], [], [], [], [], []]]);
  const [botPicks, setBotPicks] = useState([[[], [], [], [], [], [], [], []]]);
  const [pickOrder, setPickOrder] = useState([]);
  const [botPickOrder, setBotPickOrder] = useState([]);

  const submitDeckForm = useRef();

  const makeBotPick = (tempPack) => {
    const cardsSeen = tempPack.filter((card) => card);
    addSeen(seen, cardsSeen, initialDraft.synergies);

    const ratings = options.map((mask) => {
      const cards = mask.map((include, index) => (include ? tempPack[index] : null)).filter((card) => card);

      let rating = 0;

      for (const card of cards) {
        rating += unWeightedRating(card, picked, seen, initialDraft.synergies, null, 9, 2)[0];
      }

      return rating;
    });

    const mask = options[ratings.indexOf(Math.max(...ratings))];
    const tempPicks = [];

    for (let i = 0; i < 9; i++) {
      if (mask[i] && tempPack[i]) {
        tempPicks.push(tempPack[i]);
        tempPack[i] = null;
      }
    }

    setBotPickOrder(botPickOrder.concat([tempPicks]));
    addSeen(picked, tempPicks, initialDraft.synergies);

    return [tempPack, tempPicks];
  };

  const nextPack = () => {
    if (initialDraft.unopenedPacks.length < packNumber + 1) {
      return [];
    }

    setPackNumber(packNumber + 1);

    return initialDraft.unopenedPacks[packNumber];
  };

  const finish = async () => {
    const updatedDraft = JSON.parse(JSON.stringify(initialDraft));

    const { deck, sideboard, colors } = await buildGridDraftDeck(
      botPicks.flat(3),
      picked,
      initialDraft.synergies,
      initialDraft.basics,
    );

    updatedDraft.seats[1].drafted = deck;
    updatedDraft.seats[1].sideboard = sideboard;
    updatedDraft.seats[1].pickorder = botPickOrder;
    updatedDraft.seats[1].name = `Bot: ${colors.length > 0 ? colors.join(', ') : 'C'}`;
    updatedDraft.seats[1].description = `This deck was drafted by a bot with color preference for ${colors.join('')}.`;

    updatedDraft.seats[0].drafted = picks.flat();
    updatedDraft.seats[0].sideboard = [];
    updatedDraft.seats[0].pickorder = pickOrder;

    await csrfFetch(`/cube/api/submitgriddraft/${initialDraft.cube}`, {
      method: 'POST',
      body: JSON.stringify(updatedDraft),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    submitDeckForm.current.submit();
  };

  const makePick = (mask) => {
    let tempPack = JSON.parse(JSON.stringify(pack));
    const tempPicks = JSON.parse(JSON.stringify(picks));
    const newPicks = [];

    for (let i = 0; i < 9; i++) {
      if (mask[i] && tempPack[i]) {
        const card = tempPack[i];
        tempPack[i] = null;
        tempPicks[0][Math.min(card.cmc || card.details.cmc || 0, 7)].push(card);
        newPicks.push(card);
      }
    }

    if (packNumber % 2 === 1) {
      const [, newBotPicks] = makeBotPick(tempPack);
      tempPack = nextPack();
      const [newPack, bot2] = makeBotPick(tempPack);
      tempPack = newPack;

      const tempBotPicks = JSON.parse(JSON.stringify(botPicks));

      for (const pick of newBotPicks.concat(bot2)) {
        tempBotPicks[0][Math.min(pick.cmc || pick.details.cmc || 0, 7)].push(pick);
      }

      setBotPicks(tempBotPicks);
      setPickNumber(1);
    } else {
      tempPack = nextPack();
      setPickNumber(2);
    }

    setPicks(tempPicks);
    setPickOrder(pickOrder.concat([newPicks]));

    if (tempPack.length > 0) {
      setPack(tempPack);
    } else {
      finish(tempPicks);
    }
  };

  const pickRow = (row) => {
    const mask = [];
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        if (i === row) {
          mask.push(true);
        } else {
          mask.push(false);
        }
      }
    }
    makePick(mask);
  };

  const pickCol = (col) => {
    const mask = [];
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        if (j === col) {
          mask.push(true);
        } else {
          mask.push(false);
        }
      }
    }
    makePick(mask);
  };

  return (
    <CubeLayout cube={cube} cubeID={cubeID} activeLink="playtest">
      <DisplayContextProvider>
        <Navbar expand="xs" light className="usercontrols">
          <Collapse navbar>
            <Nav navbar>
              <CustomImageToggler />
            </Nav>
          </Collapse>
        </Navbar>
        <DynamicFlash />
        <CSRFForm
          className="d-none"
          innerRef={submitDeckForm}
          method="POST"
          action={`/cube/submitgriddeck/${initialDraft.cube}`}
        >
          <Input type="hidden" name="body" value={initialDraft._id} />
        </CSRFForm>
        <DndProvider>
          <ErrorBoundary>
            <Pack pack={pack} packNumber={packNumber} pickNumber={pickNumber} pickRow={pickRow} pickCol={pickCol} />
          </ErrorBoundary>
          <ErrorBoundary className="mt-3">
            <Card className="mt-3">
              <DeckStacks
                cards={picks}
                title="Picks"
                subtitle={subtitle(picks.flat().flat())}
                locationType={Location.PICKS}
                canDrop={() => false}
                onMoveCard={() => {}}
              />
            </Card>
            <Card className="mt-3">
              <DeckStacks
                cards={botPicks}
                title="Bot Picks"
                subtitle={subtitle(botPicks.flat().flat())}
                locationType={Location.PICKS}
                canDrop={() => false}
                onMoveCard={() => {}}
              />
            </Card>
          </ErrorBoundary>
        </DndProvider>
      </DisplayContextProvider>
    </CubeLayout>
  );
};

GridDraftPage.propTypes = {
  cube: PropTypes.shape({}).isRequired,
  cubeID: PropTypes.string.isRequired,
  initialDraft: PropTypes.shape({
    _id: PropTypes.string,
    ratings: PropTypes.objectOf(PropTypes.number),
    unopenedPacks: PropTypes.array.isRequired,
    synergies: PropTypes.shape({}),
    basics: PropTypes.shape([]),
    cube: PropTypes.string.isRequired,
  }).isRequired,
};

export default GridDraftPage;