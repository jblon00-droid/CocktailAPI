import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBeerMugEmpty,
  faMartiniGlass,
  faWhiskeyGlass,
  faWineBottle,
  faWineGlass
} from '@fortawesome/free-solid-svg-icons';

const ICONS = [faWineBottle, faMartiniGlass, faBeerMugEmpty, faWineGlass, faWhiskeyGlass];

export default function Loading({ message = 'Mixing Drinks...' }) {
  return (
    <div className="cocktails__loading" role="status">
      <div className="loading__icons" aria-hidden="true">
        {ICONS.map((icon) => (
          <FontAwesomeIcon key={icon.iconName} icon={icon} className="loading__icon" />
        ))}
      </div>
      <p>{message}</p>
    </div>
  );
}
