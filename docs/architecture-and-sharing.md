# 项目管理看板：架构与共享方案

## 推荐结论

保留 GitHub Pages 作为静态前端，使用 Supabase 提供数据库、邮件登录和行级权限。前端只使用 publishable key；不得把 secret key 或 `service_role` key 写入仓库、页面或浏览器。

不建议让浏览器直接写 GitHub API 或 Gist。公开 Gist 无法保护项目数据，私有 Gist/GitHub API 又需要令牌；把令牌放在静态网页中等于公开令牌。若必须使用 GitHub 存储，应通过独立的 serverless function 代理，但维护成本会高于 Supabase。

## 最小数据模型

第一阶段将现有项目状态整体存为 `jsonb`，避免一次性拆分所有业务表。需要复杂查询或多人编辑时，再逐步拆分 `risks`、`tasks`、`changes` 等表。

```sql
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table public.project_members (
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('viewer', 'editor')),
  primary key (project_id, user_id)
);

alter table public.projects enable row level security;
alter table public.project_members enable row level security;

create policy "members can read own membership"
on public.project_members for select
to authenticated
using (user_id = auth.uid());

create policy "owners create projects"
on public.projects for insert
to authenticated
with check (owner_id = auth.uid());

create policy "owners and members read projects"
on public.projects for select
to authenticated
using (
  owner_id = auth.uid()
  or exists (
    select 1 from public.project_members m
    where m.project_id = id and m.user_id = auth.uid()
  )
);

create policy "owners and editors update projects"
on public.projects for update
to authenticated
using (
  owner_id = auth.uid()
  or exists (
    select 1 from public.project_members m
    where m.project_id = id
      and m.user_id = auth.uid()
      and m.role = 'editor'
  )
)
with check (
  owner_id = auth.uid()
  or exists (
    select 1 from public.project_members m
    where m.project_id = id
      and m.user_id = auth.uid()
      and m.role = 'editor'
  )
);
```

初期可由项目所有者在 Supabase Dashboard 中维护 `project_members`，不开放浏览器端成员管理，减少权限规则和管理界面的复杂度。

## 前端核心代码

```js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  window.APP_CONFIG.supabaseUrl,
  window.APP_CONFIG.supabasePublishableKey
);

export async function signIn(email) {
  return supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${location.origin}${location.pathname}`
    }
  });
}

export async function loadProject(projectId) {
  const { data, error } = await supabase
    .from('projects')
    .select('id, name, data, updated_at')
    .eq('id', projectId)
    .single();
  if (error) throw error;
  return data;
}

export async function saveProject(projectId, projectState) {
  const { error } = await supabase
    .from('projects')
    .update({
      data: projectState,
      updated_at: new Date().toISOString()
    })
    .eq('id', projectId);
  if (error) throw error;
}

export function subscribeProject(projectId, onChange) {
  return supabase
    .channel(`project:${projectId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'projects',
        filter: `id=eq.${projectId}`
      },
      payload => onChange(payload.new)
    )
    .subscribe();
}
```

## 与当前代码的衔接

定义统一的数据仓库接口，让 UI 不直接依赖 `localStorage` 或 Supabase：

```js
class ProjectRepository {
  load(projectId) {}
  save(projectId, state) {}
  subscribe(projectId, onChange) {}
}
```

本地模式实现 `LocalProjectRepository`，共享模式实现 `SupabaseProjectRepository`。现有 `store.commit()` 只调用仓库接口。写入使用 500-1000ms 防抖，并在界面显示 `saving / saved / offline / conflict` 四种状态。

## 实施顺序

1. 建 Supabase 项目、执行建表与 RLS SQL。
2. 开启 Email Magic Link/OTP，配置 GitHub Pages 回调地址。
3. 创建第一个项目，将现有 JSON 导出内容写入 `projects.data`。
4. 在 Dashboard 增加登录页和只读模式；`viewer` 隐藏编辑按钮，同时依靠 RLS 真正禁止写入。
5. 将 `store` 的持久化切换为 repository；离线时保留本地副本和待同步标记。
6. 开启 `projects` 表 Realtime，收到更新后刷新当前项目。
7. 完成 XSS 清理、审计日志和备份策略后，再邀请真实干系人。

## 安全边界

- GitHub Pages 只能发布静态文件，不能在服务器端保护页面内容。
- “前端弹出共享口令”只能遮挡界面，无法防止绕过，不应当作数据权限。
- Publishable key 可以出现在浏览器；数据安全必须由 Auth JWT 和 RLS 保证。
- Secret/service-role key 永远不能进入前端。
- 所有用户输入在写入 `innerHTML` 前必须转义或通过 DOM API 渲染，避免共享数据形成存储型 XSS。
- 建议增加 `audit_logs` 表，记录操作者、时间、对象和修改摘要。

## 参考资料

- [GitHub Pages 是静态托管](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages)
- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [Supabase Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Supabase API keys](https://supabase.com/docs/guides/getting-started/api-keys)
- [Supabase Realtime Postgres Changes](https://supabase.com/docs/guides/realtime/postgres-changes)
