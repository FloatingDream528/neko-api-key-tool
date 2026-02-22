import { Nav } from '@douyinfe/semi-ui';
import { IconTag } from '@douyinfe/semi-icons-lab';
import { IconGithubLogo, IconMoon, IconSun } from '@douyinfe/semi-icons';
import { useSetTheme, useTheme } from '../context/Theme';

const HeaderBar = () => {
  const theme = useTheme();
  const setTheme = useSetTheme();

  return (
    <Nav
      mode="horizontal"
      header={{
        logo: <IconTag size="large" />,
        text: 'Neko API Key Tool',
      }}
      footer={
        <>
          {theme === 'dark' ? (
            <Nav.Item
              icon={<IconSun />}
              text="Light"
              onClick={() => setTheme(false)}
            />
          ) : (
            <Nav.Item
              icon={<IconMoon />}
              text="Dark"
              onClick={() => setTheme(true)}
            />
          )}

          {process.env.REACT_APP_SHOW_ICONGITHUB === 'true' && (
            <Nav.Item
              icon={<IconGithubLogo />}
              text="GitHub"
              onClick={() =>
                window.open(
                  'https://github.com/Calcium-Ion/neko-api-key-tool',
                  '_blank'
                )
              }
            />
          )}
        </>
      }
    />
  );
};

export default HeaderBar;
