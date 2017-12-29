import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';

import App from 'grommet/components/App';
import Split from 'grommet/components/Split';
import PrintProvider, { Print, NoPrint } from 'react-easy-print';


import NavSidebar from './NavSidebar';
import { navResponsive } from '../actions/nav';

import Login from '../screens/Login';
import Dashboard from '../screens/Dashboard';
import Tasks from '../screens/Tasks';
import Task from '../screens/Task';
import NewVisitor from '../screens/NewVisitor';
import Map from '../screens/Map';
import GiveItem from '../screens/GiveItem';
import TakeItem from '../screens/TakeItem';
import Items from '../screens/Items';
import LabourDashboard from '../screens/LDashboard';

import NotFound from '../screens/NotFound';

class Main extends Component {
  constructor() {
    super();
    this._onResponsive = this._onResponsive.bind(this);
  }

  _onResponsive(responsive) {
    this.props.dispatch(navResponsive(responsive));
  }

  render() {
    const {
      nav: { active: navActive, enabled: navEnabled, responsive }
    } = this.props;
    const includeNav = (navActive && navEnabled);
    let nav;
    if (includeNav) {
      nav = <NavSidebar />;
    }
    const priority = (includeNav && responsive === 'single' ? 'left' : 'right');

    return (
      <App centered={false}>
        <PrintProvider>
          <NoPrint>
            <Router>
              <Split
                priority={priority}
                flex='right'
                onResponsive={this._onResponsive}
              >
                {nav}
                <Switch>
                  <Route exact={true} path='/' component={Dashboard} />
                  <Route path='/dashboard' component={Dashboard} />
                  <Route path='/login' component={Login} />
                  <Route path='/visitor/:id' component={Task} />
                  <Route path='/visitors' component={Tasks} />
                  <Route path='/new/visitor' component={NewVisitor} />
                  <Route path='/map' component={Map} />
                  <Route path='/item/give' component={GiveItem} />
                  <Route path='/item/take' component={TakeItem} />
                  <Route path='/items' component={Items} />
                  <Route path='/dash/visitor' component={LabourDashboard} />
                  <Route path='/*' component={NotFound} />
                </Switch>
              </Split>
            </Router>
          </NoPrint>
        </PrintProvider>
      </App>
    );
  }
}

Main.defaultProps = {
  nav: {
    active: true, // start with nav active
    enabled: true, // start with nav disabled
    responsive: 'multiple'
  }
};

Main.propTypes = {
  dispatch: PropTypes.func.isRequired,
  nav: PropTypes.shape({
    active: PropTypes.bool,
    enabled: PropTypes.bool,
    responsive: PropTypes.string
  })
};

const select = state => ({
  nav: state.nav
});

export default connect(select)(Main);
