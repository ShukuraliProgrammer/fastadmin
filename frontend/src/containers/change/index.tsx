import React, { useContext } from 'react';
import { Breadcrumb, Button, Col, Empty, Form, message, Popconfirm, Row, Space } from 'antd';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { SaveOutlined, SaveFilled, DeleteOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { CrudContainer } from 'components/crud-container';
import { ConfigurationContext } from 'providers/ConfigurationProvider';
import { EModelPermission, IModel } from 'interfaces/configuration';
import { deleteFetcher, getFetcher, patchFetcher, postFetcher } from 'fetchers/fetchers';
import { handleError } from 'helpers/forms';
import { transformDataToServer, transformDataFromServer } from 'helpers/transform';
import { FormContainer } from 'components/form-container';
import { useIsMobile } from 'hooks/useIsMobile';
import { getTitleFromModelClass } from 'helpers/title';

export const Change: React.FC = () => {
  const [form] = Form.useForm();
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { configuration } = useContext(ConfigurationContext);
  const { t: _t } = useTranslation('Change');
  const { model, id } = useParams();

  const modelConfiguration: IModel | undefined = configuration.models.find(
    (item: IModel) => item.name === model
  );

  const { data: initialChangeValues, isLoading: isLoadingInitialValues } = useQuery(
    [`/retrieve/${model}/${id}`],
    () => getFetcher(`/retrieve/${model}/${id}`),
    {
      refetchOnWindowFocus: false,
    }
  );

  const {
    mutate: mutateAdd,
    isLoading: isLoadingAdd,
    isError: isErrorAdd,
  } = useMutation((payload: any) => postFetcher(`/add/${model}`, payload), {
    onSuccess: () => {
      message.success(_t('Succesfully added'));
      queryClient.invalidateQueries([`/list/${model}`]);
      const next = form.getFieldValue('next');
      if (next) {
        navigate(next);
      }
    },
    onError: (error: Error) => {
      handleError(error, form);
    },
  });

  const { mutate, isLoading, isError } = useMutation(
    (payload: any) => patchFetcher(`/change/${model}/${id}`, payload),
    {
      onSuccess: () => {
        message.success(_t('Succesfully changed'));
        queryClient.invalidateQueries([`/retrieve/${model}/${id}`]);
        queryClient.invalidateQueries([`/list/${model}`]);
        const next = form.getFieldValue('next');
        if (next) {
          navigate(next);
        }
      },
      onError: (error: Error) => {
        handleError(error, form);
      },
    }
  );

  const { mutate: mutateDelete } = useMutation(() => deleteFetcher(`/delete/${model}/${id}`), {
    onSuccess: () => {
      message.success(_t('Successfully deleted'));
      queryClient.invalidateQueries([`/list/${model}`]);
      navigate(`/list/${model}`);
    },
    onError: () => {
      message.error(_t('Server error'));
    },
  });

  const onFinish = (payload: any) => {
    const saveAsNew = form.getFieldValue('save_as_new');
    if (saveAsNew) {
      mutateAdd(transformDataToServer(payload));
      return;
    }
    mutate(transformDataToServer(payload));
  };

  const onConfirmDelete = () => mutateDelete();

  const onSaveAndContinueEditing = () => {
    form.submit();
  };

  const onSaveAndAddAnother = () => {
    form.setFieldValue('next', `/add/${model}`);
    if (modelConfiguration?.save_as) {
      form.setFieldValue('save_as_new', true);
    }
    form.submit();
  };

  const onSave = () => {
    if (!modelConfiguration?.save_as_continue) {
      form.setFieldValue('next', `/list/${model}`);
    }
    form.submit();
  };

  return (
    <CrudContainer
      title={`${_t('Change')} ${getTitleFromModelClass(model)} ${id}`}
      breadcrumbs={
        <Breadcrumb>
          <Breadcrumb.Item>
            <Link to="/">{_t('Dashboard')}</Link>
          </Breadcrumb.Item>
          <Breadcrumb.Item>
            <Link to={`/list/${model}`}>{getTitleFromModelClass(model)}</Link>
          </Breadcrumb.Item>
          <Breadcrumb.Item>{id}</Breadcrumb.Item>
        </Breadcrumb>
      }
      isLoading={isLoadingInitialValues}
    >
      {initialChangeValues &&
      modelConfiguration &&
      modelConfiguration.permissions.includes(EModelPermission.Change) ? (
        <FormContainer
          modelConfiguration={modelConfiguration}
          id={id}
          form={form}
          onFinish={onFinish}
          mode="change"
          hasOperationError={isError || isErrorAdd}
          initialValues={transformDataFromServer(initialChangeValues)}
        >
          <Row gutter={[8, 8]} justify="space-between">
            <Col>
              <Space>
                <Popconfirm title={_t('Are you sure?')} onConfirm={onConfirmDelete}>
                  <Button danger={true}>
                    <DeleteOutlined /> {_t('Delete')}
                  </Button>
                </Popconfirm>
              </Space>
            </Col>
            <Col>
              <Space>
                {!isMobile && !modelConfiguration?.save_as_continue && (
                  <Button
                    loading={isLoading || isLoadingAdd}
                    onClick={onSaveAndContinueEditing}
                    type="default"
                  >
                    <SaveFilled /> {_t('Save and continue editing')}
                  </Button>
                )}
                {!isMobile && (
                  <Button
                    loading={isLoading || isLoadingAdd}
                    onClick={onSaveAndAddAnother}
                    type="default"
                  >
                    <SaveFilled />{' '}
                    {modelConfiguration?.save_as ? _t('Save as new') : _t('Save and add another')}
                  </Button>
                )}
                <Button loading={isLoading || isLoadingAdd} onClick={onSave} type="primary">
                  <SaveOutlined /> {_t('Save')}
                </Button>
              </Space>
            </Col>
          </Row>
        </FormContainer>
      ) : (
        <Empty description={_t('No permissions for model')} />
      )}
    </CrudContainer>
  );
};
