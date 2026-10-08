import django.db.models.deletion
from django.db import migrations, models


def create_topic_approvals_table(apps, schema_editor):
    TopicApproval = apps.get_model("approvals", "TopicApproval")
    table_name = TopicApproval._meta.db_table
    existing_tables = set(schema_editor.connection.introspection.table_names())
    if table_name not in existing_tables:
        schema_editor.create_model(TopicApproval)


class Migration(migrations.Migration):
    dependencies = [
        ("accounts", "0001_initial"),
        ("approvals", "0001_initial"),
        ("topics", "0001_initial"),
    ]

    operations = [
        migrations.AlterField(
            model_name="topicapproval",
            name="action",
            field=models.CharField(
                choices=[
                    ("APPROVE", "Duyệt"),
                    ("REJECT", "Từ chối"),
                    ("REQUEST_REVISION", "Yêu cầu chỉnh sửa"),
                ],
                max_length=30,
            ),
        ),
        migrations.AlterModelOptions(
            name="topicapproval",
            options={
                "db_table": "topic_approvals",
                "managed": True,
                "ordering": ["-created_at"],
            },
        ),
        migrations.SeparateDatabaseAndState(
            database_operations=[],
            state_operations=[
                migrations.AddField(
                    model_name="topicapproval",
                    name="approver",
                    field=models.ForeignKey(
                        db_column="approver_id",
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="topic_approvals",
                        to="accounts.user",
                    ),
                ),
                migrations.AddField(
                    model_name="topicapproval",
                    name="topic",
                    field=models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="approvals",
                        to="topics.topic",
                    ),
                ),
            ],
        ),
        migrations.RunPython(
            create_topic_approvals_table,
            migrations.RunPython.noop,
        ),
    ]
