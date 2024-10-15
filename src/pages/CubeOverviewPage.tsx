import React, { useContext, useState } from 'react';

import Button from 'components/base/Button';
import Controls from 'components/base/Controls';
import { Flexbox } from 'components/base/Layout';
import Link from 'components/base/Link';
import BlogPost from 'components/blog/BlogPost';
import CubeOverviewCard from 'components/cube/CubeOverviewCard';
import DynamicFlash from 'components/DynamicFlash';
import CubeOverviewModal from 'components/modals/CubeOverviewModal';
import CubeSettingsModal from 'components/modals/CubeSettingsModal';
import CustomizeBasicsModal from 'components/modals/CustomizeBasicsModal';
import DeleteCubeModal from 'components/modals/DeleteCubeModal';
import RenderToRoot from 'components/RenderToRoot';
import withModal from 'components/WithModal';
import UserContext from 'contexts/UserContext';
import BlogPostType from 'datatypes/BlogPost';
import Cube, { CubeCards } from 'datatypes/Cube';
import CubeLayout from 'layouts/CubeLayout';
import MainLayout from 'layouts/MainLayout';

const CubeOverviewModalLink = withModal(Link, CubeOverviewModal);
const CubeSettingsModalLink = withModal(Link, CubeSettingsModal);
const DeleteCubeModalLink = withModal(Link, DeleteCubeModal);
const CustomizeBasicsModalLink = withModal(Link, CustomizeBasicsModal);

interface CubeOverviewProps {
  post: BlogPostType;
  priceOwned: number;
  pricePurchase: number;
  cube: Cube;
  cards: CubeCards;
  followed: boolean;
  followers: number;
  loginCallback: () => void;
}

const CubeOverview: React.FC<CubeOverviewProps> = ({
  post,
  cards,
  priceOwned,
  pricePurchase,
  cube,
  followed,
  followers,
}) => {
  const user = useContext(UserContext);

  const [alerts, setAlerts] = useState<{ color: string; message: string }[]>([]);
  const [cubeState, setCubeState] = useState(cube);

  const addAlert = (color: string, message: string) => {
    setAlerts([...alerts, { color, message }]);
  };

  const onCubeUpdate = (updated: Cube) => {
    addAlert('success', 'Update Successful');
    setCubeState(updated);
  };

  return (
    <MainLayout>
      <CubeLayout
        cards={cards}
        cube={cubeState}
        activeLink="overview"
        hasControls={user != null && cube.owner.id == user.id}
      >
        <Flexbox direction="col" gap="2" className="mb-2">
          {user && cubeState.owner.id === user.id && (
            <Controls>
              <Flexbox direction="row" justify="start" gap="4" alignItems="center" className="py-2 px-4">
                <CubeOverviewModalLink
                  modalprops={{
                    cube: cubeState,
                    onError: (message: string) => addAlert('danger', message),
                    onCubeUpdate,
                  }}
                >
                  Edit Overview
                </CubeOverviewModalLink>
                <CubeSettingsModalLink modalprops={{ addAlert, onCubeUpdate }}>Edit Settings</CubeSettingsModalLink>
                <CustomizeBasicsModalLink
                  modalprops={{
                    cube: cubeState,
                    onError: (message: string) => {
                      addAlert('danger', message);
                    },
                    updateBasics: (basics: any) => {
                      const deepClone = JSON.parse(JSON.stringify(cubeState));
                      deepClone.basics = basics;
                      onCubeUpdate(deepClone);
                    },
                  }}
                >
                  Customize basics
                </CustomizeBasicsModalLink>
                <DeleteCubeModalLink modalprops={{ cubeId: cubeState.id, cubeName: cubeState.name }}>
                  Delete Cube
                </DeleteCubeModalLink>
              </Flexbox>
            </Controls>
          )}
          <DynamicFlash />
          {alerts.map(({ color, message }, index) => (
            <div className={`alert alert-${color}`} key={index}>
              {message}
            </div>
          ))}
          <CubeOverviewCard
            cubeState={cubeState}
            priceOwned={priceOwned}
            pricePurchase={pricePurchase}
            followers={followers}
            followed={followed}
          />
          {post && <BlogPost key={post.id} post={post} />}
          {post && (
            <Button color="primary" block href={`/cube/blog/${cubeState.id}`}>
              View All Blog Posts
            </Button>
          )}
        </Flexbox>
      </CubeLayout>
    </MainLayout>
  );
};

export default RenderToRoot(CubeOverview);
