import React from 'react';
import './404.css'; // Assuming you will create a CSS file for basic styling

/**
 * NotFoundPage component to display a 404 error message.
 *
 * This component informs the user that the requested page does not exist
 * and provides options to check the URL or return to the homepage.
 *
 * @returns {JSX.Element}
 */
const NotFoundPage = () => {
  return (
    <div className="not-found">
      <h1>404 - Page Not Found</h1>
      <p>The page you are looking for does not exist.</p>
      <p>Please check the URL or go back to the homepage.</p>
    </div>
  );
};

export default NotFoundPage;