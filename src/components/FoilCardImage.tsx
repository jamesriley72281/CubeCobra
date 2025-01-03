import CardImage, { CardImageProps } from 'components/card/CardImage';
import FoilOverlay, { FoilOverlayProps } from 'components/FoilOverlay';

type FoilCardImageProps = FoilOverlayProps & CardImageProps;

const FoilCardImage: React.FC<FoilCardImageProps> = FoilOverlay(CardImage);

export default FoilCardImage;
