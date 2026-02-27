import { Nav } from '@douyinfe/semi-ui';
import { IconTag } from '@douyinfe/semi-icons-lab';
import { IconConnectionPoint1, IconGithubLogo, IconMoon, IconSun } from '@douyinfe/semi-icons';
import { useSetTheme, useTheme } from '../context/Theme';
import { getEnv } from '../helpers/env';

const HeaderBar = () => {
  const theme = useTheme();
  const setTheme = useSetTheme();

  return (
    <Nav
      mode="horizontal"
      header={{
        logo: <IconConnectionPoint1 size="large" style={{ color: 'var(--aurora-accent-cyan)' }} />,
        text: 'Neko API 查询',
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

          {getEnv('REACT_APP_SHOW_ICONGITHUB') === 'true' && (
            <Nav.Item
              icon={<IconGithubLogo />}
              text="GitHub"
              onClick={() =>
                window.open(
                  'https://github.com/FloatingDream528/neko-api-key-tool',
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
