import React from 'react';
import PropTypes from 'prop-types';

import { Card, CardHeader, CardBody, Row, Col } from 'reactstrap';

import DynamicFlash from 'components/DynamicFlash';
import ButtonLink from 'components/ButtonLink';
import MainLayout from 'layouts/MainLayout';
import RenderToRoot from 'utils/RenderToRoot';
import TimeAgo from 'react-timeago';

const NoticePage = ({ loginCallback, notices }) => {
  const applications = notices.filter((notice) => notice.Type === 'a');
  const reports = notices.filter((notice) => notice.Type === 'cr');

  return (
    <MainLayout loginCallback={loginCallback}>
      <DynamicFlash />
      <Card className="my-3">
        <CardHeader>
          <h5>Content Creator Applications</h5>
        </CardHeader>
        {applications.map((application) => (
          <Card>
            <CardBody>
              <p>
                Details:
                <Card>
                  {application.Body.split('\n').map((item) => (
                    <>
                      {item}
                      <br />
                    </>
                  ))}
                </Card>
              </p>
              <p>
                Submitted by by:{' '}
                <a href={`/user/view/${application.User}`} target="_blank" rel="noopener noreferrer">
                  {application.User}
                </a>
                - <TimeAgo date={application.Date} />
              </p>
              <Row>
                <Col xs="12" sm="6">
                  <ButtonLink color="accent" block outline href={`/admin/application/approve/${application.Id}`}>
                    Approve
                  </ButtonLink>
                </Col>
                <Col xs="12" sm="6">
                  <ButtonLink color="unsafe" block outline href={`/admin/application/decline/${application.Id}`}>
                    Decline
                  </ButtonLink>
                </Col>
              </Row>
            </CardBody>
          </Card>
        ))}
      </Card>
      <Card className="my-3">
        <CardHeader>
          <h5>Recent Comment Reports</h5>
        </CardHeader>
        {reports.map((report) => (
          <Card>
            <CardBody>
              <p>
                Comment:{' '}
                <a href={`/comment/${report.Subject}`} target="_blank" rel="noopener noreferrer">
                  {report.Subject}
                </a>
              </p>
              <p>Reason: {report.Body}</p>
              <p>
                Reported by:{' '}
                <a href={`/user/view/${report.User}`} target="_blank" rel="noopener noreferrer">
                  {report.User}
                </a>
                - <TimeAgo date={report.Date} />
              </p>
              <Row>
                <Col xs="12" sm="6">
                  <ButtonLink color="accent" block outline href={`/admin/ignorereport/${report.Id}`}>
                    Ignore
                  </ButtonLink>
                </Col>
                <Col xs="12" sm="6">
                  <ButtonLink color="unsafe" block outline href={`/admin/removecomment/${report.Id}`}>
                    Remove Comment
                  </ButtonLink>
                </Col>
              </Row>
            </CardBody>
          </Card>
        ))}
      </Card>
    </MainLayout>
  );
};

NoticePage.propTypes = {
  loginCallback: PropTypes.string,
  notices: PropTypes.arrayOf(PropTypes.shape({})).isRequired,
};

NoticePage.defaultProps = {
  loginCallback: '/',
};

export default RenderToRoot(NoticePage);
