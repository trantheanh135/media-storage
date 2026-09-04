import Keycloak from 'keycloak-js';

const keycloakConfig = {
  url: 'http://localhost:8081',
  realm: 'media-storage',
  clientId: 'media-storage-web',
};

const keycloak = new Keycloak(keycloakConfig);

export const initKeycloak = () => {
  return keycloak.init({
    onLoad: 'check-sso',
    silentCheckSsoRedirectUri: window.location.origin + '/silent-check-sso.html',
    pkceMethod: 'S256',
    checkLoginIframe: false,
  });
};

export const login = () => {
  keycloak.login();
};

export const logout = () => {
  keycloak.logout({ redirectUri: window.location.origin });
};

export const getToken = () => {
  return keycloak.token;
};

export const isLoggedIn = () => {
  return keycloak.authenticated;
};

export const getUsername = () => {
  return keycloak.tokenParsed?.preferred_username || '';
};

export const getEmail = () => {
  return keycloak.tokenParsed?.email || '';
};

export const getUserInfo = () => {
  return {
    username: keycloak.tokenParsed?.preferred_username,
    email: keycloak.tokenParsed?.email,
    firstName: keycloak.tokenParsed?.given_name,
    lastName: keycloak.tokenParsed?.family_name,
    sub: keycloak.tokenParsed?.sub,
  };
};

export const refreshToken = () => {
  return keycloak.refreshToken(30);
};

export default keycloak;
