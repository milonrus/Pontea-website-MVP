import LanguageSwitcher from './LanguageSwitcher';

const LocalizedPageTopBar = () => {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 pt-4">
      <div className="flex justify-end">
        <LanguageSwitcher />
      </div>
    </div>
  );
};

export default LocalizedPageTopBar;

