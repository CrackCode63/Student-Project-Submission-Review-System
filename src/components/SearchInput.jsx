import { Search } from 'lucide-react';
import { InputField } from './InputField';

export function SearchInput({ label = 'Search', placeholder = 'Search...', ...props }) {
  return <InputField label={label} icon={Search} placeholder={placeholder} {...props} />;
}
