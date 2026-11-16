import importlib.util
from pathlib import Path
import unittest

PATH = Path(__file__).parents[2] / 'scripts' / 'contabo-staging-coolify-db-sync.py'
spec = importlib.util.spec_from_file_location('staging_sync', PATH)
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)


def staging_app(**override):
    value = {
        'name':'786-chat-staging-app', 'uuid':'abcdefghijklmnopqrst',
        'fqdn':'https://staging.786.chat',
        'git_repository':'https://github.com/786-Chat/786-chat',
        'git_branch':'contabo-staging-db-adapter-20261114'
    }
    value.update(override)
    return value


class TestAppSelection(unittest.TestCase):
    def test_selects_unique_staging_application(self):
        self.assertEqual(mod.select_app([staging_app()])['uuid'], 'abcdefghijklmnopqrst')

    def test_refuses_live_domain(self):
        for value in ('https://786.chat', 'https://www.786.chat', 'https://staging.786.chat,https://786.chat'):
            with self.subTest(value=value), self.assertRaises(RuntimeError):
                mod.select_app([staging_app(fqdn=value)])

    def test_refuses_wrong_branch(self):
        with self.assertRaisesRegex(RuntimeError, 'branch'):
            mod.select_app([staging_app(git_branch='main')])

    def test_refuses_wrong_repo(self):
        with self.assertRaises(RuntimeError):
            mod.select_app([staging_app(git_repository='https://github.com/other/project')])

    def test_refuses_duplicate_app(self):
        with self.assertRaises(RuntimeError):
            mod.select_app([staging_app(), staging_app()])

    def test_refuses_unknown_uuid(self):
        with self.assertRaises(RuntimeError):
            mod.select_app([staging_app(uuid='')])


class TestEnvironmentSelection(unittest.TestCase):
    def test_selects_runtime_not_preview(self):
        selected = mod.select_env([
            {'key': 'DATABASE_URL', 'is_preview': True, 'value': 'preview'},
            {'key': 'DATABASE_URL', 'is_preview': False, 'value': 'runtime'},
        ])
        self.assertEqual(selected['value'], 'runtime')

    def test_refuses_duplicate_runtime(self):
        with self.assertRaises(RuntimeError):
            mod.select_env([
                {'key':'DATABASE_URL', 'is_preview':False},
                {'key':'DATABASE_URL', 'is_preview':False},
            ])

    def test_refuses_no_runtime(self):
        with self.assertRaises(RuntimeError):
            mod.select_env([{'key':'DATABASE_URL', 'is_preview':True}])

    def test_hostname_is_exact(self):
        self.assertEqual(mod.hostname('https://staging.786.chat'), 'staging.786.chat')
        self.assertEqual(mod.hostname('https://evil-staging.786.chat'), 'evil-staging.786.chat')


if __name__ == '__main__':
    unittest.main()
