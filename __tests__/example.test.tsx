import { render } from '@testing-library/react-native';
import TestComponent from '../src/components/TestComponent';

test('renders correctly', () => {
  const { getByText } = render(<TestComponent />);
  expect(getByText('Test Text')).toBeTruthy();
}); 