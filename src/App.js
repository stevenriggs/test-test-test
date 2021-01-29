import React, { Component } from "react";
import "./App.css";
// Azure AD authentication
import * as azureAD from "./utils/AzureAD";
import * as graph from "./utils/Graph";
// react-bootstrap
import Container from "react-bootstrap/Container";
import Col from "react-bootstrap/Col";
import Row from "react-bootstrap/Row";
// app components
import Header from "./components/Header";
import LandingPage from "./components/LandingPage";
import View1 from "./components/View1";
import View2 from "./components/View2";
import Report1 from "./components/Report1";
import Report2 from "./components/Report2";
import Report3 from "./components/Report3";

class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      isAuthenticated: false,
      isAuthorized: false,
      isSigningIn: true,
      selectedView: "View 1",
      user: {},
    };
    this.getUserProfile = this.getUserProfile.bind(this);
    this.login = this.login.bind(this);
    this.logout = this.logout.bind(this);
    this.handleChangeView = this.handleChangeView.bind(this);
  }

  // for the data refresh interval
  intervalID;

  componentDidMount() {
    this.getUserProfile();
    // Refresh all tokens and user identity data on a schedule
    this.intervalID = setInterval(this.getUserProfile, 180000);
  }

  componentWillUnmount() {
    /*
          stop token refresh from continuing to run even
          after unmounting this component.
      */
    clearInterval(this.intervalID);
  }

  async login() {
    //console.log("login")
    this.setState({
      isSigningIn: true,
    });
    await azureAD.login();
    this.getUserProfile();
  }

  async logout() {
    await azureAD.logout();
    this.setState({
      isAuthenticated: false,
      isAuthorized: false,
      isSigningIn: false,
      user: {},
    });
  }

  async getUserProfile() {
    // If there is a cached user we are already logged in
    var cachedUser = azureAD.getCachedUser();
    //console.log('cached user: ' + JSON.stringify(cachedUser))

    if (cachedUser) {
      // Get the graph token
      const graphToken = await azureAD.getToken(["user.read"]);
      //console.log("grapToken: " + JSON.stringify(graphToken))

      // Get user data from Graph
      if (graphToken) {
        var graphUser = await graph.getUserDetails(graphToken);
        //console.log("graphUser: " + JSON.stringify(graphUser));
      } else {
        // token fetch failed, remove user data and go
        this.setState({
          isAuthenticated: false,
          isAuthorized: false,
          isSigningIn: false,
          user: {},
        });
        return;
      }

      // Get the token for the app api
      const apiToken = await azureAD.getToken([window.REACT_APP_API_SCOPE]);
      //console.log("apiToken: " + JSON.stringify(apiToken));

      // Roles
      if (apiToken) {
        // Turn the user roles into a hierarchical thing
        // The user object will carry a bool for each role
        // We also determine a top level, "primary" role for display
        var theRoles = "";
        var thePrimaryRole = "";
        var isAdministrator = false;
        var isAuthorized = false;
        var isUser = false;
        if (apiToken.idTokenClaims.roles) {
          // Only set these if we have roles in the token.
          theRoles = apiToken.idTokenClaims.roles.toString();
          //console.log(theRoles);
          if (theRoles.includes("User")) {
            thePrimaryRole = "User";
            isUser = true;
            isAuthorized = true;
          }
          if (theRoles.includes("Administrator")) {
            thePrimaryRole = "Administrator";
            isAdministrator = true;
            isUser = true;
            isAuthorized = true;
          }
        }
      } else {
        // token fetch failed, remove user data and go
        this.setState({
          isAuthenticated: false,
          isAuthorized: false,
          isSigningIn: false,
          user: {},
        });
        return;
      }

      //Set the state with the new user data
      this.setState({
        isAuthenticated: true,
        isAuthorized: isAuthorized,
        isSigningIn: false,
        user: {
          displayName: graphUser.displayName,
          email: graphUser.mail || graphUser.userPrincipalName,
          isAdministrator: isAdministrator,
          isUser: isUser,
          primaryRole: thePrimaryRole,
          roles: theRoles,
          graphToken: graphToken,
          apiToken: apiToken,
          userName: apiToken.account.username,
        },
        error: null,
      });
    } else {
      // there was no user in the browser cache
      this.setState({
        isAuthenticated: false,
        isAuthorized: false,
        isSigningIn: false,
        user: {},
      });
    }
  }

  handleChangeView(view) {
    this.setState({
      selectedView: view,
    });
  }

  render() {
    console.log(JSON.stringify(this.state.user));
    console.log("isAuthenticated: " + this.state.isAuthenticated);
    console.log("isAuthorized: " + this.state.isAuthorized);

    // Build the array of nav links for the header
    let navigation = [{ name: "View 1" }, { name: "View 2" }];
    // only show the reports dropdown if the user is an administrator
    if (this.state.user.isAdministrator) {
      navigation.push({
        name: "Reports",
        sub: [{ name: "Report 1" }, { name: "Report 2" }, { name: "Report 3" }],
      });
    }

    /* Login Screen */
    if (!this.state.isAuthenticated || !this.state.isAuthorized) {
      return (
        <LandingPage
          applicationName={window.REACT_APP_NAME}
          applicationDescription={window.REACT_APP_DESCRIPTION}
          brandImage={window.REACT_APP_BRAND_IMAGE}
          backgroundImage={window.REACT_APP_LANDING_PAGE_BACKGROUND}
          isAuthenticated={this.state.isAuthenticated}
          isAuthorized={this.state.isAuthorized}
          isSigningIn={this.state.isSigningIn}
          login={this.login}
          logout={this.logout}
          user={this.state.user}
        />
      );
    }

    /* Main App View */
    return (
      <Container fluid className="m-0 p-0">
        <Row noGutters>
          <Col>
            <Header
              applicationName={window.REACT_APP_NAME}
              applicationVersion={window.REACT_APP_VERSION}
              helpSupportText={window.REACT_APP_HELP_SUPPORT_TEXT}
              navigation={navigation}
              logout={this.logout}
              user={this.state.user}
              bgTopColor={window.REACT_APP_HEADER_BG_TOP_COLOR}
              bgBottomColor={window.REACT_APP_HEADER_BG_BOTTOM_COLOR}
              handleChangeView={this.handleChangeView}
              selectedView={this.state.selectedView}
              expandBreakpoint={window.REACT_APP_HEADER_EXPAND_BREAKPOINT}
              variant={window.REACT_APP_HEADER_VARIANT}
            />
          </Col>
        </Row>
        <Row noGutters>
          <Col>
            {this.state.selectedView === "View 1" && <View1 />}
            {this.state.selectedView === "View 2" && <View2 />}
            {this.state.selectedView === "Report 1" && <Report1 />}
            {this.state.selectedView === "Report 2" && <Report2 />}
            {this.state.selectedView === "Report 3" && <Report3 />}
          </Col>
        </Row>
      </Container>
    );
  }
}

export default App;
